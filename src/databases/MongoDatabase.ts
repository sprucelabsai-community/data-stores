import {
	MongoClientOptions,
	MongoClient,
	Db,
	ObjectID,
	MongoError,
} from 'mongodb'
import SpruceError from '../errors/SpruceError'
import { Database } from '../types/database.types'
import { QueryOptions } from '../types/query.types'
import mongoUtil from '../utilities/mongo.utility'

export const MONGO_TEST_URI = 'mongodb://localhost:27017'

export default class MongoDatabase implements Database {
	private mongo: MongoClient
	private db?: Db
	private dbName: string
	private disableAutoGeneratedIdsOnTheseCollections: string[] = []

	public constructor(
		url: string,
		options?: MongoClientOptions & { dbName?: string }
	) {
		const { dbName, ...rest } = options ?? {}

		this.mongo = new MongoClient(url, {
			...(rest || {}),
			serverSelectionTimeoutMS: 5000,
			useUnifiedTopology: true,
		})

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
		const o = new ObjectID()
		return o.toHexString()
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
		if (!this.mongo.isConnected() || !this.db) {
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

			return this.normalizeRecord(created.ops[0])
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

			return created.ops.map((c) => this.normalizeRecord(c))
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
		return {
			id: _id.toString(),
			...rest,
		}
	}

	public async close(): Promise<void> {
		if (this.isConnected()) {
			await this.mongo.close(true)
		}
	}

	public async connect() {
		if (!this.isConnected()) {
			try {
				await this.mongo.connect()
			} catch (err) {
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
		return this.mongo.isConnected()
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

	public async createUniqueIndex(
		collection: string,
		fields: string[]
	): Promise<void> {
		const index: Record<string, any> = {}
		fields.forEach((name) => {
			index[name] = 1
		})
		await this.assertDbWhileAttempingTo('create a unique index.', collection)
			.collection(collection)
			.createIndex(index, { unique: true })
	}

	public async update(
		collection: string,
		query: Record<string, any>,
		updates: Record<string, any>
	) {
		const q = this.toMongoIdAndNull(collection, query)

		const values = mongoUtil.prepareUpdates(updates)

		const results = await this.assertDbWhileAttempingTo(
			'update many records.',
			collection
		)
			.collection(collection)
			.updateMany(q, values)

		return results.result.n
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
				.findOneAndUpdate(q, values, { returnOriginal: false })

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
					{ upsert: true, returnOriginal: false }
				)

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
