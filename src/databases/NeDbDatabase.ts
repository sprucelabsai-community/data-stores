import dotenv from 'dotenv'
import differenceWith from 'lodash/differenceWith'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import uniqBy from 'lodash/uniqBy'
import Datastore from 'nedb'
import SpruceError from '../errors/SpruceError'
import AbstractMutexer from '../mutexers/AbstractMutexer'
import { Database, UniqueIndex } from '../types/database.types'
import { QueryOptions } from '../types/query.types'
import generateId from '../utilities/generateId'
import mongoUtil from '../utilities/mongo.utility'
dotenv.config()

const NULL_PLACEHOLDER = '_____NULL_____'
const UNDEFINED_PLACEHOLDER = '_____UNDEFINED_____'
const SHOULD_SIMULATE_SLOW_QUERIES =
	process.env.SHOULD_SIMULATE_SLOW_QUERIES === 'true'
const SLOW_QUERY_MAX_RANDOM_DELAY_MS = parseInt(
	`${process.env.SLOW_QUERY_MAX_RANDOM_DELAY_MS ?? 100}`,
	10
)

export default class NeDbDatabase extends AbstractMutexer implements Database {
	private collections: {
		[name: string]: Datastore
	} = {}
	private _isConnected = false

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

	private valuesToDocument(values: Record<string, any>) {
		const withId = this.toMongoId(values)

		const nullsToPlaceholder: Record<string, any> = this.handlePlaceholders(
			withId,
			NULL_PLACEHOLDER,
			(val: any) =>
				val === null || typeof val === 'undefined' || val === NULL_PLACEHOLDER
		)

		const undefinedToPlaceholder: Record<string, any> = this.handlePlaceholders(
			nullsToPlaceholder,
			UNDEFINED_PLACEHOLDER,
			(val: any) => val === undefined || val === UNDEFINED_PLACEHOLDER
		)

		return undefinedToPlaceholder
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
			const delay = Math.round(Math.random() * SLOW_QUERY_MAX_RANDOM_DELAY_MS)
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}

	public isConnected(): boolean {
		return this._isConnected
	}

	private normalizeRecord(record: Record<string, any>) {
		const { _id, ...rest } = record

		let values = this.handlePlaceholders(
			rest,
			null,
			(val: any) => val === null || val === NULL_PLACEHOLDER
		)

		if (!_id) {
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
		values: Record<string, any>
	): Promise<Record<string, any>> {
		await this.randomDelay()
		const all = await this.create(collection, [values])
		return all[0]
	}

	public async create(
		collection: string,
		values: Record<string, any>[]
	): Promise<Record<string, any>[]> {
		const mutexName = 'createMutex'

		await this.lock(mutexName)

		await this.randomDelay()

		const col = this.loadCollection(collection)
		const mapped = values
			.map((v) => this.valuesToDocument(v))
			.map((v) => ({ _id: this.generateId(), ...v }))

		try {
			await Promise.all(
				mapped.map((m) =>
					this.assertPassesUniqueIndexes(collection, undefined, m, 'create')
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
					resolve(docs.map((doc) => this.normalizeRecord(doc)))
				}
			})
		})
	}

	private loadCollection(
		collection: string
	): Datastore<any> & { _uniqueIndexes?: string[][]; _indexes?: string[][] } {
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
		options?: QueryOptions
	): Promise<Record<string, any> | null> {
		const results = await this.find(collection, this.prepQuery(query ?? {}), {
			limit: 1,
			...(options || {}),
		})

		return results[0]
	}

	public async find(
		collection: string,
		query?: Record<string, any>,
		options?: QueryOptions
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
				cursor.sort(mapped.sort)
			}

			if (typeof mapped.limit === 'number') {
				cursor.limit(mapped.limit)
			}

			if (mapped.skip) {
				cursor.skip(mapped.skip)
			}

			cursor.exec((err: any, results: any[]) => {
				if (err) {
					reject(err)
				} else {
					resolve(results.map((r) => this.normalizeRecord(r)))
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
		const results = this.updateOne(
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
			await this.assertPassesUniqueIndexes(collection, query, updates, action)
		} catch (err) {
			this.unlock(mutexKey)
			throw err
		}

		return new Promise((resolve, reject) => {
			const col = this.loadCollection(collection)
			const values = this.valuesToDocument(mongoUtil.prepareUpdates(updates))

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
						resolve(docs ? this.normalizeRecord(docs) : numUpdated)
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
			col.remove(this.prepQuery(query), { multi: true }, (err, numDeleted) => {
				if (err) {
					reject(err)
				} else {
					resolve(numDeleted)
				}
			})
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
			for (const fields of col._uniqueIndexes) {
				const existing = query ? await this.findOne(collection, query) : null
				const q: Record<string, any> = {}
				const duplicateFields: string[] = []
				const duplicateValues: string[] = []

				fields.forEach((f) => {
					q[f] = get(values, f)
					duplicateFields.push(f)
					duplicateValues.push(q[f])
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

	public async dropIndex(collection: string, fields: string[]) {
		const col = this.loadCollection(collection)

		await this.randomDelay()

		let found = false
		let newIndexes = []

		for (const uniq of col._uniqueIndexes ?? []) {
			if (!isEqual(uniq, fields)) {
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
				if (!isEqual(index, fields)) {
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
		currentIndexes: UniqueIndex[],
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

	private doesIndexExist(currentIndexes: UniqueIndex[], fields: string[]) {
		for (const index of currentIndexes ?? []) {
			if (isEqual(index, fields)) {
				return true
			}
		}

		return false
	}

	public async createUniqueIndex(
		collection: string,
		fields: string[]
	): Promise<void> {
		const col = this.loadCollection(collection)
		if (!col._uniqueIndexes) {
			col._uniqueIndexes = []
		}

		await this.randomDelay()
		this.assertIndexDoesNotExist(col._uniqueIndexes, fields, collection)

		if (col._uniqueIndexes) {
			const tempUniqueIndexes = [...col._uniqueIndexes]
			tempUniqueIndexes.push(fields)

			const documents = (await this.find(collection, {})) || []

			for (const uniqueFields of tempUniqueIndexes) {
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
						friendlyMessage: `Could not create index! Unique index on '${collection}' has duplicate key for "${fields.join(
							','
						)}"`,
					})
				}
			}
		}

		col._uniqueIndexes.push(fields)
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
		this.assertIndexDoesNotExist(col._indexes, fields, collection)

		col._indexes.push(fields)
	}

	public async syncUniqueIndexes(
		collectionName: string,
		indexes: string[][]
	): Promise<void> {
		const currentIndexes = await this.getUniqueIndexes(collectionName)
		const extraIndexes = differenceWith(currentIndexes, indexes, isEqual)

		for (const index of indexes) {
			if (!this.doesIndexExist(currentIndexes, index)) {
				try {
					await this.createUniqueIndex(collectionName, index)
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

	public async syncIndexes(
		collectionName: string,
		indexes: string[][]
	): Promise<void> {
		const currentIndexes = await this.getIndexes(collectionName)
		const extraIndexes = differenceWith(currentIndexes, indexes, isEqual)

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
}
