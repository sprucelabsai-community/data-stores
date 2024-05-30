import { buildLog } from '@sprucelabs/spruce-skill-utils'
import differenceWith from 'lodash/differenceWith'
import isEqual from 'lodash/isEqual'
import {
    MongoClientOptions,
    MongoClient,
    Db,
    MongoError,
    CreateIndexesOptions,
} from 'mongodb'
import SpruceError from '../errors/SpruceError'
import {
    Database,
    DatabaseOptions,
    Index,
    IndexWithFilter,
    UniqueIndex,
} from '../types/database.types'
import { QueryOptions } from '../types/query.types'
import generateId from '../utilities/generateId'
import mongoUtil from '../utilities/mongo.utility'
import normalizeIndex from './normalizeIndex'

export const MONGO_TEST_URI = 'mongodb://localhost:27017'

export default class MongoDatabase implements Database {
    protected mongo: MongoClient
    private db?: Db
    private dbName: string
    private disableAutoGeneratedIdsOnTheseCollections: string[] = []
    private _isConnected = false

    public constructor(
        url: string,
        options?: MongoClientOptions & DatabaseOptions
    ) {
        const { dbName, log = buildLog('Mongodb'), ...rest } = options ?? {}

        if (dbName === 'undefined') {
            throw new SpruceError({
                code: 'INVALID_DATABASE_NAME',
                suppliedName: dbName,
            })
        }

        try {
            this.mongo = new MongoClient(url, {
                ...(rest || {}),
                serverSelectionTimeoutMS: 5000,
            })
            this.mongo.on('error', (err) => {
                log.error('MONGO ERROR', err.stack ?? err.message)
            })
        } catch (err: any) {
            if (err.message.includes('Invalid scheme')) {
                throw new SpruceError({ code: 'INVALID_DB_CONNECTION_STRING' })
            }
            throw err
        }

        this.dbName = dbName ?? 'mercury'
    }

    public count(
        collection: string,
        query?: Record<string, any>
    ): Promise<number> {
        const col = this.assertDbWhileAttempingTo(
            'count records',
            collection
        ).collection(collection)

        return col.countDocuments(
            query ? this.toMongoIdAndNull(collection, query) : {}
        )
    }

    public generateId(): string {
        return generateId()
    }

    public async delete(
        collection: string,
        query: Record<string, any>
    ): Promise<number> {
        const results = await this.assertDbWhileAttempingTo(
            'delete many records',
            collection
        )
            .collection(collection)
            .deleteMany(this.toMongoIdAndNull(collection, query))

        return results.deletedCount ?? 0
    }

    public async deleteOne(
        collection: string,
        query: Record<string, any>
    ): Promise<number> {
        const results = await this.assertDbWhileAttempingTo(
            'delete one record',
            collection
        )
            .collection(collection)
            .deleteOne(this.toMongoIdAndNull(collection, query))

        return results.deletedCount ?? 0
    }

    private assertDbWhileAttempingTo(attempt: string, collectionName?: string) {
        if (!this.isConnected() || !this.db) {
            throw new SpruceError({
                code: 'DATABASE_NOT_CONNECTED',
                operationAttempted: attempt,
                collectionName,
            })
        }

        return this.db
    }

    public async findOne(
        collection: string,
        query?: Record<string, any>,
        options?: QueryOptions
    ): Promise<Record<string, any> | null> {
        let q

        try {
            q = this.toMongoIdAndNull(collection, query || {})
        } catch (err) {
            return null
        }

        const match = await this.assertDbWhileAttempingTo(
            'found one record.',
            collection
        )
            .collection(collection)
            //@ts-ignore
            .findOne(q, mongoUtil.queryOptionsToMongoFindOptions(options))

        //@ts-ignore
        return match ? this.normalizeRecord(match) : null
    }

    public async find(
        collection: string,
        query?: Record<string, any>,
        options?: QueryOptions
    ): Promise<Record<string, any>[]> {
        let q

        try {
            q = this.toMongoIdAndNull(collection, query || {})
        } catch (err) {
            return []
        }

        if (options?.limit === 0) {
            return []
        }

        const matches = await this.assertDbWhileAttempingTo(
            'find many records.',
            collection
        )
            .collection(collection)
            //@ts-ignore
            .find(q, mongoUtil.queryOptionsToMongoFindOptions(options))
            .toArray()

        return matches.map((match) => this.normalizeRecord(match))
    }

    private toMongoIdAndNull(collection: string, query: Record<string, any>) {
        const isAutoGeneratingIds =
            this.disableAutoGeneratedIdsOnTheseCollections.indexOf(
                collection
            ) === -1

        const q = mongoUtil.mapQuery(query, {
            shouldTransformToObjectId: isAutoGeneratingIds,
        })

        Object.keys(q).forEach((key) => {
            if (q[key] === undefined) {
                q[key] = null
            }
        })
        return q
    }

    public async createOne(collection: string, values: Record<string, any>) {
        const record = this.toMongoIdAndNull(collection, values)

        try {
            const created = await this.assertDbWhileAttempingTo(
                'create a new record.',
                collection
            )
                .collection(collection)
                .insertOne(record)

            return this.findOne(collection, {
                id: created.insertedId.toHexString(),
            }) as any
        } catch (err) {
            if (err instanceof MongoError) {
                if (err.code === 11000) {
                    throw new SpruceError({
                        code: 'DUPLICATE_RECORD',
                        collectionName: collection,
                        ...this.generateDuplicateFieldsForError(
                            //@ts-ignore
                            err.keyValue
                        ),
                        action: 'create',
                        originalError: err,
                    })
                }
            }

            throw err
        }
    }

    public async create(collection: string, values: Record<string, any>[]) {
        const records = values.map((v) => this.toMongoIdAndNull(collection, v))

        try {
            const created = await this.assertDbWhileAttempingTo(
                'create many records.',
                collection
            )
                .collection(collection)
                .insertMany(records)

            const ids = Object.values(created.insertedIds).map((i) =>
                i.toHexString()
            )

            return this.find(collection, {
                id: { $in: ids },
            })
        } catch (err) {
            if (err instanceof MongoError) {
                if (err.code === 11000) {
                    throw new SpruceError({
                        code: 'DUPLICATE_RECORD',
                        collectionName: collection,
                        ...this.generateDuplicateFieldsForError(
                            //@ts-ignore
                            err.keyValue
                        ),
                        action: 'create',
                        originalError: err,
                    })
                }
            }

            throw err
        }
    }

    private normalizeRecord(record: Record<string, any>) {
        const { _id, ...rest } = record

        if (!_id) {
            return rest
        }

        return {
            id: _id.toString(),
            ...rest,
        }
    }

    public async close(): Promise<void> {
        if (this.isConnected()) {
            this._isConnected = false
            await this.mongo.close(true)
        }
    }

    public async connect() {
        if (!this.isConnected()) {
            try {
                this._isConnected = true
                await this.mongo.connect()
            } catch (err: any) {
                if (err.name === 'MongoParseError') {
                    throw new SpruceError({
                        code: 'INVALID_DB_CONNECTION_STRING',
                    })
                } else if (err.message.includes('ECONNREFUSED')) {
                    throw new SpruceError({ code: 'UNABLE_TO_CONNECT_TO_DB' })
                } else {
                    throw new SpruceError({
                        code: 'UNKNOWN_DATABASE_ERROR',
                        originalError: err,
                        databaseErrorMessage: err.message,
                    })
                }
            }
        }

        this.db = this.mongo.db(this.dbName)
    }

    public isConnected() {
        return this._isConnected
    }

    public async dropCollection(name: string) {
        const collections = await this.assertDbWhileAttempingTo(
            'drop an entire collection.',
            ''
        )
            .listCollections()
            .toArray()

        const doesExist = !!collections.find(
            (collection) => collection.name === name
        )

        if (doesExist) {
            const collection = this.assertDbWhileAttempingTo(
                'drop the collection.',
                ''
            ).collection(name)
            await collection.drop()
        }
    }

    public async dropDatabase(): Promise<void> {
        await this.assertDbWhileAttempingTo(
            'drop the entire database.'
        ).dropDatabase()
    }

    private async listIndexes(collection: string) {
        try {
            return await this.assertDbWhileAttempingTo(
                'get indexes.',
                collection
            )
                .collection(collection)
                .listIndexes()
                .toArray()
        } catch (err) {
            return []
        }
    }

    public async dropIndex(collection: string, index: UniqueIndex) {
        const indexes = await this.listIndexes(collection)

        let found = false

        for (const thisIndex of indexes) {
            if (isEqual(Object.keys(thisIndex.key), index)) {
                await this.assertDbWhileAttempingTo('drop a index.', collection)
                    .collection(collection)
                    .dropIndex(thisIndex.name)
                found = true
            }
        }
        if (!found) {
            throw new SpruceError({
                code: 'INDEX_NOT_FOUND',
                missingIndex: normalizeIndex(index).fields,
                collectionName: collection,
            })
        }
    }

    public async getUniqueIndexes(collection: string) {
        try {
            const indexes = await this.listIndexes(collection)

            const uniqueIndexes: string[][] = []

            for (const index of indexes) {
                if (index.unique) {
                    uniqueIndexes.push(Object.keys(index.key))
                }
            }

            return uniqueIndexes
        } catch (err) {
            return []
        }
    }

    public async getIndexes(collection: string, shouldIncludeUnique = false) {
        try {
            const indexes = await this.listIndexes(collection)

            if (shouldIncludeUnique) {
                return indexes
            }

            const nonUniqueIndexes: string[][] = []

            for (const index of indexes) {
                if (!index.unique) {
                    nonUniqueIndexes.push(Object.keys(index.key))
                }
            }

            return nonUniqueIndexes
        } catch (err) {
            return []
        }
    }

    public async createIndex(
        collection: string,
        fields: string[]
    ): Promise<void> {
        const currentIndexes = await this.getIndexes(collection)
        await this.assertIndexDoesNotExist(currentIndexes, fields, collection)

        const index: Record<string, any> = {}
        fields.forEach((name) => {
            index[name] = 1
        })

        try {
            await this.assertDbWhileAttempingTo('create an index.', collection)
                .collection(collection)
                .createIndex(index)
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new SpruceError({
                    code: 'DUPLICATE_KEY',
                    friendlyMessage: `Could not create index! Index on '${collection}' has duplicate key for "${fields.join(
                        ','
                    )}"`,
                })
            } else {
                throw err
            }
        }
    }

    private assertIndexDoesNotExist(
        currentIndexes: UniqueIndex[] | Index[] | IndexWithFilter[],
        fields: string[],
        collectionName: string
    ) {
        if (this.doesIndexExist(currentIndexes, fields)) {
            throw new SpruceError({
                code: 'INDEX_EXISTS',
                index: fields,
                collectionName,
            })
        }
    }

    private doesIndexExist(
        currentIndexes: UniqueIndex[] | Index[] | IndexWithFilter[],
        fields: string[]
    ) {
        for (const index of currentIndexes ?? []) {
            const { fields: normalizedFields } = this.normalizeIndex(index)
            if (isEqual(normalizedFields, fields)) {
                return true
            }
        }

        return false
    }

    public async syncIndexes(
        collectionName: string,
        indexes: string[][]
    ): Promise<void> {
        const currentIndexes = await this.getIndexes(collectionName)
        const extraIndexes = differenceWith(
            currentIndexes,
            indexes,
            isEqual
        ).filter((i) => !(i.length === 1 && i[0] === '_id'))

        for (const index of indexes) {
            if (!this.doesIndexExist(currentIndexes, index)) {
                try {
                    await this.createIndex(collectionName, index)
                } catch (err: any) {
                    if (err.options?.code !== 'INDEX_EXISTS') {
                        throw err
                    }
                }
            }
        }
        for (const extra of extraIndexes) {
            await this.dropIndex(collectionName, extra)
        }
    }

    public async createUniqueIndex(
        collection: string,
        index: string[] | IndexWithFilter
    ): Promise<void> {
        const currentIndexes = await this.getUniqueIndexes(collection)

        const { fields, filter } = this.normalizeIndex(index)

        this.assertIndexDoesNotExist(currentIndexes, fields, collection)

        const created: Record<string, any> = {}

        fields.forEach((name) => {
            created[name] = 1
        })

        try {
            const options: CreateIndexesOptions = { unique: true }
            if (filter) {
                options.partialFilterExpression = filter
            }
            await this.assertDbWhileAttempingTo(
                'create a unique index.',
                collection
            )
                .collection(collection)
                .createIndex(created, options)
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new SpruceError({
                    code: 'DUPLICATE_KEY',
                    friendlyMessage: `Could not create index! Unique index on '${collection}' has duplicate key for "${fields.join(
                        ','
                    )}"`,
                })
            } else {
                throw err
            }
        }
    }

    private normalizeIndex(index: string[] | IndexWithFilter) {
        const { fields, filter } = normalizeIndex(index)
        return { fields, filter }
    }

    public async syncUniqueIndexes(
        collectionName: string,
        indexes: UniqueIndex[]
    ): Promise<void> {
        const currentIndexes = await this.getUniqueIndexes(collectionName)
        const toDelete: UniqueIndex[] = []

        for (const index of currentIndexes) {
            if (!this.doesIndexExist(indexes, index)) {
                toDelete.push(index)
            }
        }

        for (const index of indexes) {
            const { fields } = this.normalizeIndex(index)
            if (!this.doesIndexExist(currentIndexes, fields)) {
                try {
                    await this.createUniqueIndex(collectionName, index)
                } catch (err: any) {
                    if (err.options?.code !== 'INDEX_EXISTS') {
                        throw err
                    }
                }
            }
        }
        for (const extra of toDelete) {
            await this.dropIndex(collectionName, extra)
        }
    }

    public async update(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>
    ) {
        const q = this.toMongoIdAndNull(collection, query)

        const values = mongoUtil.prepareUpdates(updates)

        const { modifiedCount } = await this.assertDbWhileAttempingTo(
            'update many records.',
            collection
        )
            .collection(collection)
            .updateMany(q, values)

        return modifiedCount
    }

    public async updateOne(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>
    ): Promise<Record<string, any>> {
        const q = this.toMongoIdAndNull(collection, query)

        const values = mongoUtil.prepareUpdates(updates)

        try {
            const results = await this.assertDbWhileAttempingTo(
                'update one record.',
                collection
            )
                .collection(collection)
                .findOneAndUpdate(q, values, { returnDocument: 'after' })

            if (!results) {
                throw new SpruceError({
                    code: 'RECORD_NOT_FOUND',
                    storeName: 'MongoDatabase',
                    query,
                })
            }

            return this.normalizeRecord(results)
        } catch (err) {
            if (err instanceof MongoError) {
                if (err.code === 11000) {
                    throw new SpruceError({
                        code: 'DUPLICATE_RECORD',
                        collectionName: collection,
                        ...this.generateDuplicateFieldsForError(
                            //@ts-ignore
                            err.keyValue
                        ),
                        action: 'updateOne',
                        originalError: err,
                    })
                }
            }

            throw err
        }
    }

    public async upsertOne(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>
    ): Promise<Record<string, any>> {
        const q = this.toMongoIdAndNull(collection, query)
        const values = this.toMongoIdAndNull(collection, updates)

        try {
            const results = await this.assertDbWhileAttempingTo(
                'upsert one record.',
                collection
            )
                .collection(collection)
                .findOneAndUpdate(
                    q,
                    { $set: values },
                    { upsert: true, returnDocument: 'after' }
                )

            //@ts-ignore
            return this.normalizeRecord(results)
        } catch (err) {
            if (err instanceof MongoError) {
                if (err.code === 11000) {
                    throw new SpruceError({
                        code: 'DUPLICATE_RECORD',
                        collectionName: collection,
                        ...this.generateDuplicateFieldsForError(
                            //@ts-ignore
                            err.keyValue
                        ),
                        action: 'upsertOne',
                        originalError: err,
                    })
                }
            }

            throw err
        }
    }

    private generateDuplicateFieldsForError(
        mongoIndexKeyValue: Record<string, any>
    ) {
        const duplicateFields: string[] = []
        const duplicateValues: string[] = []

        Object.keys(mongoIndexKeyValue ?? {}).forEach((name) => {
            duplicateFields.push(name)
            duplicateValues.push(mongoIndexKeyValue[name])
        })

        return {
            duplicateFields,
            duplicateValues,
        }
    }

    public async query<T>(): Promise<T> {
        throw new SpruceError({
            code: 'NOT_IMPLEMENTED',
            friendlyMessage: `You cannot run a query using mongodb. Try a different database adapter!`,
        })
    }
}
