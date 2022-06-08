import SchemaEntity, {
	DynamicSchemaAllValues,
	Schema,
	SchemaGetValuesOptions,
	IsDynamicSchema,
	normalizeSchemaValues,
	SchemaAllValues,
	SchemaFieldNames,
	SchemaPartialValues,
	SchemaPublicFieldNames,
	SchemaPublicValues,
	SchemaValues,
	validateSchemaValues,
} from '@sprucelabs/schema'
import { SCRAMBLE_VALUE } from '../constants'
import SpruceError from '../errors/SpruceError'
import AbstractMutexer from '../mutexers/AbstractMutexer'
import { Database } from '../types/database.types'
import { QueryBuilder, QueryOptions } from '../types/query.types'
import { PrepareOptions, PrepareResults } from '../types/stores.types'
import errorUtil from '../utilities/error.utility'

const operations = [
	'$push',
	'$inc',
	'$min',
	'$max',
	'$mul',
	'$push',
	'$pull',
	'$pop',
] as const

type SaveOperation = typeof operations[number]
type SaveOperations = Partial<Record<SaveOperation, Record<string, any>>>

type Response<
	FullSchema extends Schema,
	CreateEntityInstances extends boolean,
	IncludePrivateFields extends boolean,
	PF extends SchemaPublicFieldNames<FullSchema>,
	F extends SchemaFieldNames<FullSchema>
> = IsDynamicSchema<FullSchema> extends true
	? DynamicSchemaAllValues<FullSchema, CreateEntityInstances>
	: IncludePrivateFields extends false
	? Pick<SchemaPublicValues<FullSchema, CreateEntityInstances>, PF>
	: Pick<SchemaAllValues<FullSchema, CreateEntityInstances>, F>

export default abstract class AbstractStore<
	FullSchema extends Schema,
	CreateSchema extends Schema = FullSchema,
	UpdateSchema extends Schema = CreateSchema,
	DatabaseSchema extends Schema = FullSchema,
	DatabaseRecord = SchemaValues<DatabaseSchema> & { id: string },
	QueryRecord = SchemaPartialValues<FullSchema>,
	FullRecord = SchemaValues<FullSchema>,
	CreateRecord = SchemaValues<CreateSchema>,
	UpdateRecord = SchemaValues<UpdateSchema> & SaveOperations
> extends AbstractMutexer {
	public abstract readonly name: string

	protected abstract collectionName: string
	protected abstract createSchema: CreateSchema
	protected abstract updateSchema: UpdateSchema
	protected abstract fullSchema: FullSchema
	protected abstract databaseSchema: DatabaseSchema
	protected scrambleFields?: string[]

	protected db: Database

	// place to set any indexes, run once after instantiation
	public initialize?(): Promise<void>

	// run on each record before it's returned by the store
	protected prepareRecord?<
		IncludePrivateFields extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>
	>(
		record: DatabaseRecord,
		options?: PrepareOptions<IncludePrivateFields, FullSchema, F>
	): Promise<PrepareResults<FullSchema, IncludePrivateFields>>

	protected willCreate?(
		values: CreateRecord
	): Promise<Omit<DatabaseRecord, 'id'>>

	protected willUpdate?(
		updates: UpdateRecord,
		values: DatabaseRecord
	): Promise<Partial<DatabaseRecord>>

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

	private setCollectionName(name: string) {
		this.collectionName = name
	}

	protected async prepareAndNormalizeRecord<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>
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

		return normalizeSchemaValues(this.fullSchema, preparedRecord, {
			...options,
			fields: options.includeFields,
			shouldIncludePrivateFields: options.shouldIncludePrivateFields === true,
			createEntityInstances: false as CreateEntityInstances,
		} as unknown as SchemaGetValuesOptions<FullSchema, SchemaFieldNames<FullSchema>, SchemaPublicFieldNames<FullSchema>, CreateEntityInstances, IncludePrivateFields>)
	}

	public async create<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>
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
				//@ts-ignore
				id: v.id ?? this.db.generateId(),
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
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>
	>(
		values: CreateRecord,
		options?: PrepareOptions<CreateEntityInstances, FullSchema, F>
	) {
		try {
			//@ts-ignore
			validateSchemaValues(this.createSchema, values)

			const cleanedValues = this.willCreate
				? await this.willCreate(values)
				: values

			const databaseRecord = {
				...cleanedValues,
				//@ts-ignore
				id: cleanedValues.id ?? this.db.generateId(),
			}

			const toSave = normalizeSchemaValues(
				this.databaseSchema,
				//@ts-ignore
				databaseRecord,
				{ shouldCreateEntityInstances: false }
			)

			const record = await this.db.createOne(this.collectionName, toSave)

			return this.prepareAndNormalizeRecord(record, options)
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

	public async findOne<
		CreateEntityInstances extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>
	>(
		query: QueryBuilder<QueryRecord>,
		options: PrepareOptions<CreateEntityInstances, FullSchema, F> = {}
	) {
		const results = await this.find(query, { limit: 1 }, options)

		if (results.length > 0) {
			return results[0]
		}

		return null
	}

	public async count(query?: QueryBuilder<QueryRecord>) {
		const count = await this.db.count(this.collectionName, query)
		return count
	}

	public async find<
		CreateEntityInstances extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>
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
				//@ts-ignore
				this.prepareAndNormalizeRecord(result, options)
			)

			const records = await Promise.all(all)

			return records
		}

		return []
	}

	public async upsertOne<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>
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
				const created = await this.createOne(updates, options)
				//@ts-ignore
				return created
			}

			const entity = new SchemaEntity(this.updateSchema, updates)
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
		PF extends SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>
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
		return this.db.update(this.collectionName, query, updates)
	}

	private async findOneAndUpdate<
		IncludePrivateFields extends boolean = true,
		CreateEntityInstances extends boolean = false,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
		PF extends SchemaPublicFieldNames<FullSchema> = SchemaPublicFieldNames<FullSchema>
	>(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord,
		notFoundHandler: () => Promise<FullRecord>,
		options: PrepareOptions<IncludePrivateFields, FullSchema, F> = {}
	): Promise<
		Response<FullSchema, CreateEntityInstances, IncludePrivateFields, PF, F>
	> {
		const { ops, updates: initialUpdates } = this.pluckOperations(updates)

		try {
			const isScrambled = this.isScrambled(initialUpdates)

			let current: any = await this.findOne(query, options)
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
				...current,
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
				query,
				normalizedValues
			)

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
		const ops = operations
			.map((name) => {
				if (name in initialUpdates) {
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

		const scrambledFields = this.scrambleFields?.reduce((values, name) => {
			values[name] = SCRAMBLE_VALUE
			return values
		}, {} as Record<string, any>)

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
		return await this.db.deleteOne(this.collectionName, query)
	}

	public async delete(query: QueryBuilder<QueryRecord>): Promise<number> {
		return await this.db.delete(this.collectionName, query)
	}
}
