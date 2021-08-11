import { differenceWith, isEqual } from 'lodash'
import get from 'lodash/get'
import isObject from 'lodash/isObject'
import Datastore from 'nedb'
import SpruceError from '../errors/SpruceError'
import AbstractMutexer from '../mutexers/AbstractMutexer'
import { Database, UniqueIndex } from '../types/database.types'
import { QueryOptions } from '../types/query.types'
import generateId from '../utilities/generateId'
import mongoUtil from '../utilities/mongo.utility'

const NULL_PLACEHOLDER = '_____NULL_____'
const UNDEFINED_PLACEHOLDER = '_____UNDEFINED_____'

export default class NeDbDatabase extends AbstractMutexer implements Database {
	private collections: {
		[name: string]: Datastore
	} = {}
	private _isConnected = false

	public generateId(): string {
		return generateId()
	}

	public connect(): Promise<void> {
		this._isConnected = true
		return Promise.resolve()
	}

	public close(): Promise<void> {
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

		// return nullsToPlaceholder

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

		// values = this.handlePlaceholders(
		// 	values,
		// 	undefined,
		// 	(val: any) => val === undefined || val === UNDEFINED_PLACEHOLDER
		// )

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

	public count(
		collection: string,
		query?: Record<string, any>
	): Promise<number> {
		const col = this.loadCollection(collection)

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
		const all = await this.create(collection, [values])
		return all[0]
	}

	public async create(
		collection: string,
		values: Record<string, any>[]
	): Promise<Record<string, any>[]> {
		const mutexName = 'createMutex'

		await this.lock(mutexName)

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
	): Datastore<any> & { _uniqueIndexes?: string[][] } {
		if (!this.collections[collection]) {
			this.collections[collection] = new Datastore()
		}
		const c = this.collections[collection]
		return c
	}

	public dropCollection(name: string): Promise<void> {
		delete this.collections[name]
		return Promise.resolve()
	}

	public dropDatabase(): Promise<void> {
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

	public find(
		collection: string,
		query?: Record<string, any>,
		options?: QueryOptions
	): Promise<Record<string, any>[]> {
		return new Promise((resolve, reject) => {
			const col = this.loadCollection(collection)
			const mapped = mongoUtil.queryOptionsToMongoFindOptions(options)

			const q = this.prepQuery(query ?? {})
			const cursor = col.find(q)

			if (mapped.sort) {
				cursor.sort(mapped.sort)
			}

			if (mapped.limit) {
				cursor.limit(mapped.limit)
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
								query: preppedQuery,
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

	public delete(
		collection: string,
		query: Record<string, any>
	): Promise<number> {
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

	public deleteOne(
		collection: string,
		query: Record<string, any>
	): Promise<number> {
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

		return col._uniqueIndexes ?? []
	}

	public async dropIndex(collection: string, fields: string[]) {
		const col = this.loadCollection(collection)

		let found = false
		const newIndexes = []

		for (const uniq of col._uniqueIndexes ?? []) {
			if (!isEqual(uniq, fields)) {
				newIndexes.push(uniq)
			} else {
				found = true
			}
		}

		if (!found) {
			throw new SpruceError({ code: 'INDEX_NOT_FOUND', missingIndex: fields })
		}

		col._uniqueIndexes = newIndexes
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
		const col = this.loadCollection(collection)
		if (!col._uniqueIndexes) {
			col._uniqueIndexes = []
		}

		this.assertUniqueIndexDoesNotExist(col._uniqueIndexes, fields)

		col._uniqueIndexes.push(fields)
	}

	public async syncUniqueIndexes(
		collectionName: string,
		indexes: string[][]
	): Promise<void> {
		const currentIndexes = await this.getUniqueIndexes(collectionName)
		const extraIndexes = differenceWith(currentIndexes, indexes, isEqual)

		for (const index of indexes) {
			if (!this.doesUniqueIndexExist(currentIndexes, index)) {
				try {
					await this.createUniqueIndex(collectionName, index)
				} catch (err) {
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
