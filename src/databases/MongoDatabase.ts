import { differenceWith, isEqual } from 'lodash'
import { MongoClientOptions, MongoClient, Db, MongoError } from 'mongodb'
import SpruceError from '../errors/SpruceError'
import { Database, UniqueIndex } from '../types/database.types'
import { QueryOptions } from '../types/query.types'
import generateId from '../utilities/generateId'
import mongoUtil from '../utilities/mongo.utility'

export const MONGO_TEST_URI = 'mongodb://localhost:27017'

export default class MongoDatabase implements Database {
	private mongo: MongoClient
	private db?: Db
	private dbName: string
	private disableAutoGeneratedIdsOnTheseCollections: string[] = []
	private _isConnected = false

	public constructor(
		url: string,
		options?: MongoClientOptions & { dbName?: string }
	) {
		const { dbName, ...rest } = options ?? {}

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
		} catch (err: any) {
			if (err.message.includes('Invalid connection')) {
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
		const q = query ? this.toMongoIdAndNull(collection, query) : {}

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
		const q = this.toMongoIdAndNull(collection, query || {})

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
			this.disableAutoGeneratedIdsOnTheseCollections.indexOf(collection) === -1

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

			const ids = Object.values(created.insertedIds).map((i) => i.toHexString())

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
					throw new SpruceError({ code: 'INVALID_DB_CONNECTION_STRING' })
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

	private async listIndexes(collection: string) {
		try {
			return await this.assertDbWhileAttempingTo('get indexes.', collection)
				.collection(collection)
				.listIndexes()
				.toArray()
		} catch (err) {
			return []
		}
	}

	public async dropIndex(collection: string, fields: string[]) {
		const indexes = await this.listIndexes(collection)

		let found = false

		for (const index of indexes) {
			if (isEqual(Object.keys(index.key), fields)) {
				await this.assertDbWhileAttempingTo('drop a index.', collection)
					.collection(collection)
					.dropIndex(index.name)
				found = true
			}
		}
		if (!found) {
			throw new SpruceError({ code: 'INDEX_NOT_FOUND', missingIndex: fields })
		}
	}

	private assertUniqueIndexDoesNotExist(
		currentIndexes: UniqueIndex[],
		fields: string[]
	) {
		if (this.doesUniqueIndexExist(currentIndexes, fields)) {
			throw new SpruceError({ code: 'INDEX_EXISTS', index: fields })
		}
	}

	private doesUniqueIndexExist(
		currentIndexes: UniqueIndex[],
		fields: string[]
	) {
		for (const uniq of currentIndexes ?? []) {
			if (isEqual(uniq, fields)) {
				return true
			}
		}

		return false
	}

	public async createUniqueIndex(
		collection: string,
		fields: string[]
	): Promise<void> {
		const currentIndexes = await this.getUniqueIndexes(collection)
		await this.assertUniqueIndexDoesNotExist(currentIndexes, fields)

		const index: Record<string, any> = {}
		fields.forEach((name) => {
			index[name] = 1
		})

		try {
			await this.assertDbWhileAttempingTo('create a unique index.', collection)
				.collection(collection)
				.createIndex(index, { unique: true })
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

	public async syncUniqueIndexes(
		collectionName: string,
		indexes: string[][]
	): Promise<void> {
		const currentIndexes = await this.getUniqueIndexes(collectionName)
		const extraIndexes = differenceWith(currentIndexes, indexes, isEqual)

		for (const index of indexes) {
			if (!this.doesUniqueIndexExist(currentIndexes, index)) {
				await this.createUniqueIndex(collectionName, index)
			}
		}
		for (const extra of extraIndexes) {
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

		const count = this.count(collection, q)
		await this.assertDbWhileAttempingTo('update many records.', collection)
			.collection(collection)
			.updateMany(q, values)

		return count
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

			if (!results.value) {
				throw new SpruceError({
					code: 'RECORD_NOT_FOUND',
					storeName: 'MongoDatabase',
					query: q,
				})
			}

			return this.normalizeRecord(results.value)
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
			return this.normalizeRecord(results.value)
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
}
