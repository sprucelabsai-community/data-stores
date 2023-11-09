import SchemaEntity, {
	Schema,
	SchemaGetValuesOptions,
	normalizeSchemaValues,
	SchemaFieldNames,
	SchemaPartialValues,
	SchemaPublicFieldNames,
	SchemaValues,
	validateSchemaValues,
} from '@sprucelabs/schema'
import { SCRAMBLE_VALUE } from '../constants'
import BatchCursorImpl, { FindBatchOptions } from '../cursors/BatchCursor'
import SpruceError from '../errors/SpruceError'
import AbstractMutexer from '../mutexers/AbstractMutexer'
import { DataStorePlugin, Database } from '../types/database.types'
import { QueryBuilder, QueryOptions } from '../types/query.types'
import {
	PrepareOptions,
	PrepareResults,
	SaveOperations,
	DataStore,
	saveOperations,
} from '../types/stores.types'
import errorUtil from '../utilities/error.utility'

export default abstract class AbstractStore<
		FullSchema extends Schema,
		CreateSchema extends Schema = FullSchema,
		UpdateSchema extends Schema = CreateSchema,
		DatabaseSchema extends Schema = FullSchema,
		DatabaseRecord = SchemaValues<DatabaseSchema>,
		QueryRecord = SchemaPartialValues<FullSchema>,
		FullRecord = SchemaValues<FullSchema>,
		CreateRecord = SchemaValues<CreateSchema>,
		UpdateRecord = SchemaValues<UpdateSchema> & SaveOperations,
	>
	extends AbstractMutexer
	implements DataStore
{
	public abstract readonly name: string

	protected abstract collectionName: string
	protected abstract createSchema: CreateSchema
	protected abstract updateSchema: UpdateSchema
	protected abstract fullSchema: FullSchema
	protected abstract databaseSchema: DatabaseSchema
	protected scrambleFields?: string[]
	protected db: Database
	protected primaryFieldNames: string[] = ['id']
	protected shouldMapLowerCaseToCamelCase = false
	protected plugins: DataStorePlugin[] = []

	// place to set any indexes, run once after instantiation
	public initialize?(): Promise<void>

	// run on each record before it's returned by the store
	protected prepareRecord?<
		IncludePrivateFields extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
	>(
		record: DatabaseRecord,
		options?: PrepareOptions<IncludePrivateFields, FullSchema, F>
	): Promise<PrepareResults<FullSchema, IncludePrivateFields>>

	protected willCreate?(
		values: CreateRecord
	): Promise<Omit<DatabaseRecord, 'id'>>

	protected didCreate?(values: CreateRecord): Promise<void>

	protected willUpdate?(
		updates: UpdateRecord,
		record: DatabaseRecord
	): Promise<Partial<DatabaseRecord>>

	protected didUpdate?(
		old: DatabaseRecord,
		updated: DatabaseRecord
	): Promise<void>

	protected willScramble?(
		values: Partial<DatabaseRecord> & { _isScrambled: true }
	): Promise<Partial<DatabaseRecord>>

	protected constructor(db: Database, collectionName?: string) {
		super()

		this.db = db

		if (collectionName) {
			this.setCollectionName(collectionName)
		}
	}

	protected setCollectionName(name: string) {
		this.collectionName = name
	}

	public getDb() {
		return this.db
	}

	public getCollectionName() {
		return this.collectionName
	}

	protected async prepareAndNormalizeRecord<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends
			SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>,
	>(
		record: any,
		options: PrepareOptions<IncludePrivateFields, FullSchema, F> = {}
	): Promise<
		Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>
	> {
		const preparedRecord = this.prepareRecord
			? await this.prepareRecord(record, options)
			: record

		const isScrambled = this.isScrambled(preparedRecord)

		if (isScrambled) {
			return preparedRecord
		}

		if (this.shouldMapLowerCaseToCamelCase) {
			this.mapCasing(preparedRecord)
		}

		return normalizeSchemaValues(this.fullSchema, preparedRecord, {
			...options,
			fields: options.includeFields,
			shouldIncludePrivateFields: options.shouldIncludePrivateFields === true,
			shouldCreateEntityInstances: false as CreateEntityInstances,
			shouldIncludeNullAndUndefinedFields: false,
		} as unknown as SchemaGetValuesOptions<
			FullSchema,
			SchemaFieldNames<FullSchema>,
			SchemaPublicFieldNames<FullSchema>,
			CreateEntityInstances,
			IncludePrivateFields,
			false
		>) as Response<
			FullSchema,
			CreateEntityInstances,
			IncludePrivateFields,
			PF,
			F
		>
	}

	private mapCasing(preparedRecord: any) {
		const fields = this.fullSchema.fields ?? {}
		Object.keys(fields).forEach((f) => {
			const lowerF = f.toLowerCase()
			if (lowerF !== f && lowerF in preparedRecord) {
				preparedRecord[f] = preparedRecord[lowerF]
				delete preparedRecord[lowerF]
			}
		})
	}

	public async create<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends
			SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>,
	>(
		values: CreateRecord[],
		options?: PrepareOptions<CreateEntityInstances, FullSchema, F>
	): Promise<
		Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>[]
	> {
		try {
			//@ts-ignore
			values.forEach((v) => validateSchemaValues(this.createSchema, v))

			const cleanedValues = await Promise.all(
				values.map(async (v) => (this.willCreate ? this.willCreate(v) : v))
			)

			const databaseRecords = cleanedValues.map((v) => ({
				...v,
				[this.primaryFieldName]:
					//@ts-ignore
					v[this.primaryFieldName] ?? this.db.generateId(),
			}))

			const toSave = databaseRecords.map((r) =>
				normalizeSchemaValues(
					this.databaseSchema,
					//@ts-ignore
					r,
					{ shouldCreateEntityInstances: false }
				)
			)

			const records = await this.db.create(this.collectionName, toSave)

			return Promise.all(
				records.map(async (record) =>
					this.prepareAndNormalizeRecord(record, options)
				)
			) as any
		} catch (err: any) {
			const coded = errorUtil.transformToSpruceErrors(
				err,
				new SpruceError({
					code: 'UNKNOWN_STORE_ERROR',
					storeName: this.name,
					action: 'create',
					originalError: err,
				})
			)
			throw coded[0]
		}
	}

	public async createOne<
		CreateEntityInstances extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
	>(
		values: CreateRecord,
		options?: PrepareOptions<CreateEntityInstances, FullSchema, F>
	) {
		try {
			let valuesToMixinBeforeCreate = await this.handleWillCreatePlugins(values)

			//@ts-ignore
			validateSchemaValues(this.createSchema, values)

			const cleanedValues = this.willCreate
				? await this.willCreate(values)
				: values

			const databaseRecord = {
				...cleanedValues,
				[this.primaryFieldName]:
					//@ts-ignore
					cleanedValues[this.primaryFieldName] ?? this.db.generateId(),
			}

			const toSave = normalizeSchemaValues(
				this.databaseSchema,
				//@ts-ignore
				databaseRecord,

				{ shouldCreateEntityInstances: false }
			)

			const record = await this.db.createOne(this.collectionName, {
				...toSave,
				...valuesToMixinBeforeCreate,
			})
			await this.didCreate?.(record as any)

			const normalized = await this.prepareAndNormalizeRecord(record, options)

			const mixinValuesOnReturn =
				await this.handleDidCreateForPlugins(normalized)

			return { ...normalized, ...mixinValuesOnReturn }
		} catch (err: any) {
			const coded = errorUtil.transformToSpruceErrors(
				err,
				new SpruceError({
					code: 'UNKNOWN_STORE_ERROR',
					storeName: this.name,
					action: 'create',
					originalError: err,
				})
			)
			throw coded[0]
		}
	}

	private async handleWillCreatePlugins(values: CreateRecord) {
		let valuesToMixinBeforeCreate = {}
		for (const plugin of this.plugins) {
			const r = await plugin.willCreateOne?.(values as Record<string, any>)
			const { valuesToMixinBeforeCreate: v } = r ?? {}
			if (v) {
				valuesToMixinBeforeCreate = {
					...valuesToMixinBeforeCreate,
					...v,
				}
			}
		}
		return valuesToMixinBeforeCreate
	}

	private async handleDidCreateForPlugins(record: Record<string, any>) {
		let mixinValuesOnReturn = {}

		for (const plugin of this.plugins) {
			const r = await plugin.didCreateOne?.(record)
			mixinValuesOnReturn = {
				...mixinValuesOnReturn,
				...r?.valuesToMixinBeforeReturning,
			}
		}
		return mixinValuesOnReturn
	}

	private get primaryFieldName() {
		return this.primaryFieldNames[0]
	}

	public async findOne<
		CreateEntityInstances extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
	>(
		query: QueryBuilder<QueryRecord>,
		options: PrepareOptions<CreateEntityInstances, FullSchema, F> = {}
	) {
		const results = await this.find(query, { limit: 1 }, options)
		let match = results[0]

		if (match) {
			match = (await this.handleDidFindForPlugins(query, match)) as typeof match
			return match
		}

		return null
	}

	private async handleDidFindForPlugins(
		query: QueryBuilder<QueryRecord>,
		match: Record<string, any>
	) {
		for (const plugin of this.plugins) {
			const { valuesToMixinBeforeReturning: values } =
				(await plugin.didFindOne?.(query, match)) ?? {}

			if (values) {
				match = { ...match, ...values }
			}
		}
		return match
	}

	public async count(query?: QueryBuilder<QueryRecord>) {
		const count = await this.db.count(this.collectionName, query)
		return count
	}

	public async find<
		CreateEntityInstances extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
	>(
		query: QueryBuilder<QueryRecord>,
		queryOptions?: Omit<QueryOptions, 'includeFields'>,
		options?: PrepareOptions<CreateEntityInstances, FullSchema, F>
	) {
		const results = await this.db.find(this.collectionName, query, {
			...queryOptions,
			includeFields: options?.includeFields,
		})

		if (results) {
			const all = results.map((result) =>
				this.prepareAndNormalizeRecord(result, {
					...options,
					shouldStripUndefinedAndNullValues: true,
				})
			)

			const records = await Promise.all(all)

			return records
		}

		return []
	}

	public async findBatch<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends
			SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>,
	>(
		query?: QueryBuilder<QueryRecord>,
		options?: FindBatchOptions<IncludePrivateFields, FullSchema, F>
	) {
		return BatchCursorImpl.Cursor<
			Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>
		>(this as AbstractStore<Schema>, query, options as any)
	}

	public async upsertOne<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends
			SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>,
	>(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord & CreateRecord & { id?: string },
		options?: PrepareOptions<IncludePrivateFields, FullSchema, F>
	): Promise<
		Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>
	> {
		const mutexKey = 'upsertOne'

		await this.lock(mutexKey)

		try {
			const notFoundHandler = async (): Promise<FullRecord> => {
				const created = await this.createOne(updates, {
					...options,
					shouldIncludePrivateFields: true,
				})
				//@ts-ignore
				return created
			}

			const entity = new SchemaEntity(this.updateSchema, updates as any)
			const cleanedUpdates = entity.getValues({
				validate: false,
				//@ts-ignore
				fields: Object.keys(updates),
				createEntityInstances: false,
			})

			if (updates.id) {
				//@ts-ignore
				cleanedUpdates.id = updates.id
			}

			const results = await this.findOneAndUpdate(
				query,
				//@ts-ignore
				cleanedUpdates,
				notFoundHandler,
				options
			)

			return results
		} finally {
			this.unlock(mutexKey)
		}
	}

	public async updateOne<
		IncludePrivateFields extends boolean = false,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends
			SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>,
	>(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord,
		options?: PrepareOptions<IncludePrivateFields, FullSchema, F>
	): Promise<
		Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>
	> {
		const notFoundHandler = async (): Promise<FullRecord> => {
			throw new SpruceError({
				code: 'RECORD_NOT_FOUND',
				storeName: this.name,
				query,
			})
		}

		return this.findOneAndUpdate(query, updates, notFoundHandler, options)
	}

	public async update(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord
	): Promise<number> {
		return this.db.update(this.collectionName, query, updates as any)
	}

	private async findOneAndUpdate<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends
			SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>,
	>(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord,
		notFoundHandler: () => Promise<FullRecord>,
		options: PrepareOptions<IncludePrivateFields, FullSchema, F> = {}
	): Promise<
		Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>
	> {
		const { ops, updates: initialUpdates } = this.pluckOperations(updates)
		let q = query

		try {
			const isScrambled = this.isScrambled(initialUpdates)

			for (const plugin of this.plugins) {
				const results = await plugin.willUpdateOne?.(q, initialUpdates)

				if (results?.query) {
					q = results.query
				}
			}

			let current: any = await this.findOne(q, {
				...options,
				shouldIncludePrivateFields: true,
			})

			if (!current) {
				current = await notFoundHandler()

				if (current) {
					return current
				} else {
					throw new Error(
						'Make sure your notFoundHandler returns a record or throws'
					)
				}
			}

			if (!isScrambled) {
				//@ts-ignore
				validateSchemaValues(this.updateSchema, initialUpdates)
			}

			const cleanedUpdates =
				!isScrambled && this.willUpdate
					? await this.willUpdate(initialUpdates, current)
					: initialUpdates

			const databaseRecord = {
				...cleanedUpdates,
			}

			const normalizedValues = isScrambled
				? databaseRecord
				: normalizeSchemaValues(this.databaseSchema, databaseRecord, {
						shouldCreateEntityInstances: false,
						fields: Object.keys(
							cleanedUpdates
						) as SchemaFieldNames<DatabaseSchema>[],
				  })

			for (const { name, value } of ops) {
				normalizedValues[name] = value
			}

			const results = await this.db.updateOne(
				this.collectionName,
				q,
				normalizedValues
			)

			await this.didUpdate?.(current, results as any)

			return this.prepareAndNormalizeRecord(results, options)
		} catch (err: any) {
			const coded = errorUtil.transformToSpruceErrors(
				err,
				new SpruceError({
					code: 'UNKNOWN_STORE_ERROR',
					storeName: this.name,
					action: 'update',
					originalError: err,
				})
			)
			throw coded[0]
		}
	}
	private pluckOperations(updates: UpdateRecord): { ops: any; updates: any } {
		const { ...initialUpdates } = updates
		const ops = saveOperations
			.map((name) => {
				if (name in (initialUpdates as Record<string, any>)) {
					//@ts-ignore
					const value = initialUpdates[name]
					//@ts-ignore
					delete initialUpdates[name]
					return {
						name,
						value,
					}
				}

				return false
			})
			.filter((o) => !!o)

		return { ops, updates: initialUpdates }
	}

	public async scramble(id: string) {
		if (!this.scrambleFields) {
			throw new SpruceError({ code: 'SCRAMBLE_NOT_CONFIGURED' })
		}

		const values: Record<string, any> = await this.generateScrambledRecord()

		//@ts-ignore
		return this.updateOne({ id }, values)
	}

	private isScrambled(preparedRecord: any) {
		return !!preparedRecord._isScrambled
	}

	private async generateScrambledRecord(): Promise<Partial<DatabaseRecord>> {
		if (!this.scrambleFields) {
			throw new SpruceError({ code: 'SCRAMBLE_NOT_CONFIGURED' })
		}

		const scrambledFields = this.scrambleFields?.reduce(
			(values, name) => {
				values[name] = SCRAMBLE_VALUE
				return values
			},
			{} as Record<string, any>
		)

		const record = {
			...scrambledFields,
			_isScrambled: true,
		} as Partial<DatabaseRecord> & { _isScrambled: true }

		const cleanedValues = this.willScramble
			? await this.willScramble(record)
			: record

		return cleanedValues
	}

	public async deleteOne(query: QueryBuilder<QueryRecord>): Promise<number> {
		let q = {
			...query,
		}

		for (const plugin of this.plugins) {
			const { query } = (await plugin.willDeleteOne?.(q)) ?? {}
			if (query) {
				q = query
			}
		}

		return await this.db.deleteOne(this.collectionName, q)
	}

	public async delete(query: QueryBuilder<QueryRecord>): Promise<number> {
		return await this.db.delete(this.collectionName, query)
	}
}

type Response<
	FullSchema extends Schema,
	CreateEntityInstances extends boolean,
	IncludePrivateFields extends boolean,
	PF extends SchemaPublicFieldNames<FullSchema>,
	F extends SchemaFieldNames<FullSchema>,
> = SchemaValues<
	FullSchema,
	CreateEntityInstances,
	IncludePrivateFields,
	false,
	F,
	PF
>
