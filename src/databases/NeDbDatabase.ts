import Datastore from '@seald-io/nedb'
import dotenv from 'dotenv'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import uniqBy from 'lodash/uniqBy'
import SpruceError from '../errors/SpruceError'
import AbstractMutexer from '../mutexers/AbstractMutexer'
import {
    CreateOptions,
    Database,
    DatabaseInternalOptions,
    Index,
    IndexWithFilter,
} from '../types/database.types'
import { QueryOptions } from '../types/query.types'
import generateId from '../utilities/generateId'
import mongoUtil from '../utilities/mongo.utility'
import {
    doesIndexesInclude,
    normalizeIndex,
    pluckMissingIndexes,
} from './database.utilities'
dotenv.config({ quiet: true })

export default class NeDbDatabase extends AbstractMutexer implements Database {
    private collections: Record<string, Datastore> = {}
    private _isConnected = false
    private fakedQueries: Record<string, FakeQueryHandler<any>> = {}

    public generateId(): string {
        return generateId()
    }

    public async connect(): Promise<void> {
        this._isConnected = true
        await this.randomDelay()

        return Promise.resolve()
    }

    public async close(): Promise<void> {
        await this.randomDelay()
        this._isConnected = false
        return Promise.resolve()
    }

    private toMongoId(query: Record<string, any>) {
        return mongoUtil.mapQuery(query, { shouldTransformToObjectId: false })
    }

    private prepQuery(query: Record<string, any>) {
        return this.valuesToDocument(this.toMongoId(query))
    }

    private valuesToDocument(
        values: Record<string, any>,
        firstPrimaryFieldName?: string
    ) {
        const withId =
            typeof values.id === 'number' ? values : this.toMongoId(values)

        if (firstPrimaryFieldName === 'id') {
            withId._id = withId.id
            delete withId.id
        }

        const nullsToPlaceholder: Record<string, any> = this.handlePlaceholders(
            withId,
            NULL_PLACEHOLDER,
            (val: any) =>
                val === null ||
                typeof val === 'undefined' ||
                val === NULL_PLACEHOLDER
        )

        const undefinedToPlaceholder: Record<string, any> =
            this.handlePlaceholders(
                nullsToPlaceholder,
                UNDEFINED_PLACEHOLDER,
                (val: any) => val === undefined || val === UNDEFINED_PLACEHOLDER
            )

        return undefinedToPlaceholder
    }

    public getShouldAutoGenerateId(): boolean {
        return true
    }

    public async setShouldAutoGenerateIds(
        collection: string,
        shouldAutoGenerateIds: boolean
    ): Promise<void> {
        const col = this.loadCollection(collection)
        //@ts-ignore
        col.indexes._id.unique = shouldAutoGenerateIds

        await this.randomDelay()
    }

    private async randomDelay() {
        if (SHOULD_SIMULATE_SLOW_QUERIES) {
            const delay = Math.round(
                Math.random() * SLOW_QUERY_MAX_RANDOM_DELAY_MS
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }

    public isConnected(): boolean {
        return this._isConnected
    }

    private normalizeRecord(
        record: Record<string, any>,
        options?: CreateOptions
    ) {
        const { _id, ...rest } = record

        let values = this.handlePlaceholders(
            rest,
            null,
            (val: any) => val === null || val === NULL_PLACEHOLDER
        )

        const { primaryFieldNames = ['id'] } = options ?? {}

        if (!_id || !primaryFieldNames.includes('id')) {
            return values
        }

        return {
            id: _id,
            ...values,
        }
    }

    private handlePlaceholders(
        values: any,
        dropIn: undefined | string | null,
        checker: (value: any) => boolean
    ) {
        let withPlaceholders: any = Array.isArray(values) ? [] : {}

        if (values instanceof RegExp) {
            return values
        }
        if (Array.isArray(values)) {
            withPlaceholders = values.map((v) =>
                this.handlePlaceholders(v, dropIn, checker)
            )
        } else if (isObject(values)) {
            Object.keys(values).forEach((key) => {
                withPlaceholders[key] = this.handlePlaceholders(
                    //@ts-ignore
                    values[key],
                    dropIn,
                    checker
                )
            })
        } else if (checker(values)) {
            withPlaceholders = dropIn
        } else {
            withPlaceholders = values
        }

        return withPlaceholders
    }

    public async count(
        collection: string,
        query?: Record<string, any>
    ): Promise<number> {
        const col = this.loadCollection(collection)
        await this.randomDelay()

        return new Promise((resolve, reject) => {
            col.count(this.prepQuery(query ?? {}), (err, count) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(count)
                }
            })
        })
    }

    public async createOne(
        collection: string,
        values: Record<string, any>,
        options?: CreateOptions
    ): Promise<Record<string, any>> {
        await this.randomDelay()

        const all = await this.create(collection, [values], options)
        return all[0]
    }

    public async create(
        collection: string,
        values: Record<string, any>[],
        options?: CreateOptions
    ): Promise<Record<string, any>[]> {
        const mutexName = 'createMutex'

        await this.lock(mutexName)
        await this.randomDelay()

        const { primaryFieldNames = ['id'] } = options ?? {}
        const firstPrimaryFieldName =
            primaryFieldNames[0] === 'id' ? '_id' : primaryFieldNames[0]

        const col = this.loadCollection(collection)
        const mapped = values
            .map((v) => this.valuesToDocument(v))
            .map((v) => ({ [firstPrimaryFieldName]: this.generateId(), ...v }))

        try {
            await Promise.all(
                mapped.map((m) =>
                    this.assertPassesUniqueIndexes(
                        collection,
                        undefined,
                        m,
                        'create'
                    )
                )
            )
        } catch (err) {
            this.unlock(mutexName)

            throw err
        }

        return new Promise((resolve, reject) => {
            col.insert(mapped, (err, docs) => {
                this.unlock(mutexName)

                if (err) {
                    reject(err)
                } else {
                    resolve(
                        docs.map((doc) => this.normalizeRecord(doc, options))
                    )
                }
            })
        })
    }

    private loadCollection(collection: string): Datastore<any> & {
        _uniqueIndexes?: IndexWithFilter[]
        _indexes?: IndexWithFilter[]
    } {
        if (!this.collections[collection]) {
            this.collections[collection] = new Datastore()
        }
        const c = this.collections[collection]
        return c
    }

    public async dropCollection(name: string): Promise<void> {
        await this.randomDelay()
        delete this.collections[name]
        return Promise.resolve()
    }

    public async dropDatabase(): Promise<void> {
        await this.randomDelay()
        this.collections = {}
        return Promise.resolve()
    }

    public async findOne(
        collection: string,
        query?: Record<string, any>,
        options?: QueryOptions,
        dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any> | null> {
        const results = await this.find(
            collection,
            query ?? {},
            {
                limit: 1,
                ...(options || {}),
            },
            dbOptions
        )

        const match = results[0]

        return match
    }

    public async find(
        collection: string,
        query?: Record<string, any>,
        options?: QueryOptions,
        dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any>[]> {
        await this.randomDelay()

        if (options?.limit === 0) {
            return []
        }

        return new Promise((resolve, reject) => {
            const col = this.loadCollection(collection)
            const mapped = mongoUtil.queryOptionsToMongoFindOptions(options)

            const q = this.prepQuery(query ?? {})
            const cursor = col.find(q, mapped.projection)

            if (mapped.sort) {
                //@ts-ignore
                cursor.sort(mapped.sort)
            }

            if (typeof mapped.limit === 'number') {
                //@ts-ignore
                cursor.limit(mapped.limit)
            }

            if (mapped.skip) {
                //@ts-ignore
                cursor.skip(mapped.skip)
            }

            //@ts-ignore
            cursor.exec((err: any, results: any[]) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(
                        results.map((r) => this.normalizeRecord(r, dbOptions))
                    )
                }
            })
        })
    }

    public async update(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>,
        neDbOptions?: Record<string, any>
    ) {
        const results = await this.updateOne(
            collection,
            query,
            updates,
            {
                ...neDbOptions,
                multi: true,
                returnUpdatedDocs: false,
            },
            'update'
        )

        return results as unknown as number
    }

    public async updateOne(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>,
        neDbOptions?: Record<string, any>,
        action = 'updateOne'
    ): Promise<Record<string, any>> {
        const preppedQuery = this.prepQuery(query)
        const mutexKey = 'updateMutex'
        await this.lock(mutexKey)

        await this.randomDelay()

        try {
            await this.assertPassesUniqueIndexes(
                collection,
                query,
                updates,
                action
            )
        } catch (err) {
            this.unlock(mutexKey)
            throw err
        }

        return new Promise((resolve, reject) => {
            const col = this.loadCollection(collection)
            const values = this.valuesToDocument(
                mongoUtil.prepareUpdates(updates)
            )

            col.update(
                preppedQuery,
                values,
                { returnUpdatedDocs: true, ...(neDbOptions || {}) },
                async (err: Error | null, numUpdated: number, docs: any) => {
                    this.unlock(mutexKey)

                    if (err) {
                        reject(err)
                    } else if (!neDbOptions?.multi && numUpdated === 0) {
                        reject(
                            new SpruceError({
                                code: 'RECORD_NOT_FOUND',
                                storeName: 'NeDatabase',
                                query,
                            })
                        )
                    } else {
                        resolve(
                            docs
                                ? this.normalizeRecord(docs, neDbOptions)
                                : numUpdated
                        )
                    }
                }
            )
        })
    }

    public upsertOne(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>
    ): Promise<Record<string, any>> {
        return this.updateOne(
            collection,
            query,
            updates,
            { upsert: true },
            'upsertOne'
        )
    }

    public async delete(
        collection: string,
        query: Record<string, any>
    ): Promise<number> {
        await this.randomDelay()

        return new Promise((resolve, reject) => {
            const col = this.loadCollection(collection)
            col.remove(
                this.prepQuery(query),
                { multi: true },
                (err, numDeleted) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(numDeleted)
                    }
                }
            )
        })
    }

    public async deleteOne(
        collection: string,
        query: Record<string, any>
    ): Promise<number> {
        await this.randomDelay()

        return new Promise((resolve, reject) => {
            const col = this.loadCollection(collection)

            col.remove(this.prepQuery(query), (err, numDeleted) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(numDeleted)
                }
            })
        })
    }

    private async assertPassesUniqueIndexes(
        collection: string,
        query: Record<string, any> | undefined,
        values: Record<string, any>,
        action: string
    ) {
        const col = this.loadCollection(collection)

        await this.randomDelay()

        if (col._uniqueIndexes) {
            for (const index of col._uniqueIndexes) {
                const { fields, filter } = normalizeIndex(index)

                if (filter) {
                    let shouldSkip = false
                    for (const key in filter) {
                        if (
                            values[key] === NULL_PLACEHOLDER ||
                            typeof values[key] === 'undefined'
                        ) {
                            shouldSkip = true
                            break
                        }
                    }
                    if (shouldSkip) {
                        continue
                    }
                }

                const existing = query
                    ? await this.findOne(collection, query)
                    : null

                let q: Record<string, any> = {}

                const duplicateFields: string[] = []
                const duplicateValues: string[] = []

                fields.forEach((f) => {
                    let value = get(values, f)
                    duplicateFields.push(f)
                    duplicateValues.push(value)
                    q[f] = value
                })

                const destination = await this.findOne(collection, q)

                if (destination && existing?.id !== destination.id) {
                    throw new SpruceError({
                        code: 'DUPLICATE_RECORD',
                        collectionName: collection,
                        duplicateFields,
                        duplicateValues,
                        action,
                    })
                }
            }
        }
    }

    public async getUniqueIndexes(collection: string) {
        const col = this.loadCollection(collection)
        await this.randomDelay()
        return col._uniqueIndexes ?? []
    }

    public async getIndexes(collection: string, shouldIncludeUnique = false) {
        const col = this.loadCollection(collection)
        await this.randomDelay()
        if (shouldIncludeUnique) {
            const uniqIndexes = col._uniqueIndexes ?? []
            return uniqIndexes.concat(col._indexes ?? [])
        }
        return col._indexes ?? []
    }

    public async dropIndex(collection: string, index: Index) {
        const col = this.loadCollection(collection)
        const { fields } = normalizeIndex(index)

        await this.randomDelay()

        let found = false
        let newIndexes = []

        for (const uniq of col._uniqueIndexes ?? []) {
            if (!isEqual(uniq.fields, fields)) {
                newIndexes.push(uniq)
            } else {
                found = true
            }
        }

        if (found) {
            col._uniqueIndexes = newIndexes
            return
        } else {
            newIndexes = []

            for (const index of col._indexes ?? []) {
                if (!isEqual(index.fields, fields)) {
                    newIndexes.push(index)
                } else {
                    found = true
                }
            }

            if (found) {
                col._indexes = newIndexes
                return
            }
        }
        throw new SpruceError({
            code: 'INDEX_NOT_FOUND',
            missingIndex: fields,
            collectionName: 'test_collection',
        })
    }

    private assertIndexDoesNotExist(
        currentIndexes: IndexWithFilter[],
        index: IndexWithFilter,
        collectionName: string
    ) {
        if (this.doesInclude(currentIndexes, index)) {
            throw new SpruceError({
                code: 'INDEX_EXISTS',
                index: index.fields,
                collectionName,
            })
        }
    }

    private doesInclude(haystack: Index[], needle: Index) {
        return doesIndexesInclude(haystack, needle)
    }

    public async createUniqueIndex(
        collection: string,
        index: Index
    ): Promise<void> {
        const col = this.loadCollection(collection)
        if (!col._uniqueIndexes) {
            col._uniqueIndexes = []
        }

        const indexWithFilter = normalizeIndex(index)

        await this.randomDelay()
        this.assertIndexDoesNotExist(
            col._uniqueIndexes,
            indexWithFilter,
            collection
        )

        if (col._uniqueIndexes && !indexWithFilter.filter) {
            const tempUniqueIndexes = [...col._uniqueIndexes]
            tempUniqueIndexes.push(indexWithFilter)

            const documents = (await this.find(collection)) || []

            for (const index of tempUniqueIndexes) {
                const { fields: uniqueFields } = normalizeIndex(index)
                let parsedExisting = []

                for (const doc of documents) {
                    const tempDoc: Record<string, any> = {}
                    uniqueFields.forEach((f) => {
                        tempDoc[f] = doc[f]
                    })
                    parsedExisting.push(tempDoc)
                }

                const uniqued = uniqBy(parsedExisting, JSON.stringify)

                if (parsedExisting.length != uniqued.length) {
                    throw new SpruceError({
                        code: 'DUPLICATE_KEY',
                        friendlyMessage: `Could not create index! Unique index on '${collection}' has duplicate key for "${uniqueFields.join(
                            ','
                        )}"`,
                    })
                }
            }
        }

        col._uniqueIndexes.push(indexWithFilter)
    }

    public async createIndex(
        collection: string,
        fields: string[]
    ): Promise<void> {
        const col = this.loadCollection(collection)
        if (!col._indexes) {
            col._indexes = []
        }

        await this.randomDelay()
        this.assertIndexDoesNotExist(
            col._indexes,
            this.normalizeIndex(fields),
            collection
        )

        col._indexes.push({ fields })
    }

    private normalizeIndex(index: string[] | IndexWithFilter): IndexWithFilter {
        const { fields, filter } = normalizeIndex(index)
        return { fields, filter }
    }

    public async syncUniqueIndexes(
        collectionName: string,
        indexes: Index[]
    ): Promise<void> {
        const currentIndexes = await this.getUniqueIndexes(collectionName)
        const toDelete: Index[] = pluckMissingIndexes(currentIndexes, indexes)

        for (const index of indexes) {
            if (!this.doesInclude(currentIndexes, index)) {
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

    public async syncIndexes(
        collectionName: string,
        indexes: string[][]
    ): Promise<void> {
        const currentIndexes = await this.getIndexes(collectionName)
        const extraIndexes = pluckMissingIndexes(currentIndexes, indexes)

        for (const index of indexes) {
            if (!this.doesInclude(currentIndexes, index)) {
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

    public async query<T>(query: string, params?: any[]): Promise<T[]> {
        const cb = this.fakedQueries[this.queryToKey(query)]
        if (cb) {
            const results = await cb(params)
            this.assertValidFakedQueryResponse(results, query)

            return results
        }

        throw new SpruceError({
            code: 'QUERY_NOT_FAKED',
            query,
        })
    }

    private queryToKey(query: string) {
        return query.toLowerCase().replace(/\s/g, '').replace(/\n/g, '')
    }

    private assertValidFakedQueryResponse(results: any[], query: string) {
        if (!Array.isArray(results)) {
            throw new SpruceError({
                code: 'INVALID_FAKE_QUERY_RESPONSE',
                query,
                response: results,
            })
        }
    }

    public fakeQuery<T>(query: string, cb: FakeQueryHandler<T>) {
        this.fakedQueries[this.queryToKey(query)] = cb
    }
}

export type FakeQueryHandler<T> = (params?: any[]) => Promise<T[]> | T[]

const NULL_PLACEHOLDER = '_____NULL_____'
const UNDEFINED_PLACEHOLDER = '_____UNDEFINED_____'
const SHOULD_SIMULATE_SLOW_QUERIES =
    process.env.SHOULD_SIMULATE_SLOW_QUERIES === 'true'
const SLOW_QUERY_MAX_RANDOM_DELAY_MS = parseInt(
    `${process.env.SLOW_QUERY_MAX_RANDOM_DELAY_MS ?? 100}`,
    10
)
