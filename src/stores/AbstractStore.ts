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
import SpruceError from '../errors/SpruceError'
import AbstractMutexer from '../mutexers/AbstractMutexer'
import { Database } from '../types/database.types'
import { QueryBuilder, QueryOptions } from '../types/query.types'
import errorUtil from '../utilities/error.utility'

export const SCRAMBLE_VALUE = '***///scrambled///***'

export interface PrepareOptions<IncludePrivateFields extends boolean> {
	includePrivateFields?: IncludePrivateFields
}

export type PrepareResults<
	S extends Schema,
	IncludePrivateFields extends boolean
> = IncludePrivateFields extends true ? SchemaPublicValues<S> : SchemaValues<S>

export default abstract class AbstractStore<
	FullSchema extends Schema,
	CreateSchema extends Schema = FullSchema,
	UpdateSchema extends Schema = CreateSchema,
	DatabaseSchema extends Schema = FullSchema,
	DatabaseRecord = SchemaValues<DatabaseSchema> & { id: string },
	QueryRecord = SchemaPartialValues<FullSchema>,
	FullRecord = SchemaValues<FullSchema>,
	CreateRecord = SchemaValues<CreateSchema>,
	UpdateRecord = SchemaValues<UpdateSchema>
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
	public abstract initialize?(): Promise<void>

	// run on each record before it's returned by the store
	protected abstract prepareRecord?<IncludePrivateFields extends boolean>(
		record: Partial<FullRecord> & { [key: string]: any },
		options?: PrepareOptions<IncludePrivateFields>
	): Promise<PrepareResults<FullSchema, IncludePrivateFields>>

	protected abstract willCreate?(
		values: CreateRecord
	): Promise<Omit<DatabaseRecord, 'id'>>

	protected abstract willUpdate?(
		values: UpdateRecord
	): Promise<Partial<DatabaseRecord>>

	protected abstract willScramble?(
		values: Partial<DatabaseRecord> & { _isScrambled: true }
	): Promise<any>

	public constructor(db: Database, collectionName?: string) {
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
		options: PrepareOptions<IncludePrivateFields> = {}
	): Promise<
		IsDynamicSchema<FullSchema> extends true
			? DynamicSchemaAllValues<FullSchema, CreateEntityInstances>
			: IncludePrivateFields extends false
			? Pick<SchemaPublicValues<FullSchema, CreateEntityInstances>, PF>
			: Pick<SchemaAllValues<FullSchema, CreateEntityInstances>, F>
	> {
		const preparedRecord = this.prepareRecord
			? await this.prepareRecord(record as Partial<FullRecord>, options)
			: record

		const isScrambled = this.isScrambled(preparedRecord)

		if (isScrambled) {
			return preparedRecord
		}

		return normalizeSchemaValues(this.fullSchema, preparedRecord, ({
			...options,
			includePrivateFields: options.includePrivateFields === true,
			createEntityInstances: false as CreateEntityInstances,
		} as unknown) as SchemaGetValuesOptions<FullSchema, SchemaFieldNames<FullSchema>, SchemaPublicFieldNames<FullSchema>, CreateEntityInstances, IncludePrivateFields>)
	}

	public async create<CreateEntityInstances extends boolean>(
		values: CreateRecord[],
		options?: PrepareOptions<CreateEntityInstances>
	) {
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
					{ createEntityInstances: false }
				)
			)

			const records = await this.db.create(this.collectionName, toSave)

			return Promise.all(
				records.map(async (record) =>
					this.prepareAndNormalizeRecord(record, options)
				)
			)
		} catch (err) {
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

	public async createOne<CreateEntityInstances extends boolean>(
		values: CreateRecord,
		options?: PrepareOptions<CreateEntityInstances>
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
				{ createEntityInstances: false }
			)

			const record = await this.db.createOne(this.collectionName, toSave)

			return this.prepareAndNormalizeRecord(record, options)
		} catch (err) {
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

	public async findOne<CreateEntityInstances extends boolean>(
		query: QueryBuilder<QueryRecord>,
		options: PrepareOptions<CreateEntityInstances> = {}
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

	public async find<CreateEntityInstances extends boolean>(
		query: QueryBuilder<QueryRecord>,
		queryOptions?: QueryOptions,
		options?: PrepareOptions<CreateEntityInstances>
	) {
		const results = await this.db.find(this.collectionName, query, queryOptions)

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

	public async upsertOne<CreateEntityInstances extends boolean>(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord & CreateRecord & { id?: string },
		options?: PrepareOptions<CreateEntityInstances>
	) {
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
		options?: PrepareOptions<IncludePrivateFields>
	): Promise<
		IncludePrivateFields extends false
			? Pick<SchemaPublicValues<FullSchema, CreateEntityInstances>, PF>
			: Pick<SchemaAllValues<FullSchema, CreateEntityInstances>, F>
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

	private async findOneAndUpdate<CreateEntityInstances extends boolean>(
		query: QueryBuilder<QueryRecord>,
		updates: UpdateRecord,
		notFoundHandler: () => Promise<FullRecord>,
		options?: PrepareOptions<CreateEntityInstances>
	) {
		try {
			const isScrambled = this.isScrambled(updates)

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
				validateSchemaValues(this.updateSchema, updates)
			}

			const cleanedUpdates =
				!isScrambled && this.willUpdate
					? await this.willUpdate(updates)
					: updates

			const databaseRecord = {
				...current,
				...cleanedUpdates,
			}

			const toSave = isScrambled
				? databaseRecord
				: normalizeSchemaValues(this.databaseSchema, databaseRecord, {
						createEntityInstances: false,
						fields: Object.keys(
							cleanedUpdates
						) as SchemaFieldNames<DatabaseSchema>[],
				  })

			const results = await this.db.updateOne(
				this.collectionName,
				query,
				toSave
			)

			return this.prepareAndNormalizeRecord(results, options)
		} catch (err) {
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

	private async generateScrambledRecord(): Promise<Record<string, any>> {
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

	public async deleteOne(query: QueryBuilder<QueryRecord>) {
		return await this.db.deleteOne(this.collectionName, query)
	}

	public async delete(query: QueryBuilder<QueryRecord>) {
		return await this.db.delete(this.collectionName, query)
	}
}
