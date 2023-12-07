import {
	SchemaFieldNames,
	SchemaValues,
	buildSchema,
	dropFields,
	makeFieldsOptional,
} from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import { QueryBuilder } from '../../../../types/query.types'
import {
	PrepareOptions,
	PrepareResults,
	UniversalStoreOptions,
} from '../../../../types/stores.types'

export default class DifferentDatabaseSchemaStore extends AbstractStore<
	FullSchema,
	CreateSchema,
	UpdateSchema,
	DatabaseSchema,
	'unitid'
> {
	public name = 'Units'
	protected collectionName = 'units'
	protected primaryFieldNames = ['unitid' as const]

	protected createSchema = createSchema
	protected updateSchema = updateSchema
	protected fullSchema = fullSchema
	protected databaseSchema = databaseSchema

	public static Store(options: UnitStoreOptions & UniversalStoreOptions) {
		return new this(options.db)
	}

	protected async willCreate(
		values: CreateUnit
	): Promise<Omit<DatabaseUnit, 'unitid'>> {
		return {
			unitstatus: values.status,
			unitdescription: values.description,
			unitcode: values.serialNumber,
		}
	}

	protected async willUpdate(values: UpdateUnit) {
		if (values.serialNumber) {
			//@ts-ignore
			values.unitcode = values.serialNumber
			delete values.serialNumber
		}
		return values as Partial<DatabaseUnit>
	}

	protected async willFind(
		query: QueryBuilder<Unit>
	): Promise<Partial<DatabaseUnit>> {
		return {
			unitid: query.id as string,
		}
	}

	protected async prepareRecord<
		IncludePrivateFields extends boolean,
		F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
	>(
		record: DatabaseUnit,
		_options?: PrepareOptions<IncludePrivateFields, FullSchema, F>
	) {
		return {
			description: record.unitdescription,
			id: record.unitid,
			serialNumber: record.unitcode,
		} as PrepareResults<FullSchema, IncludePrivateFields>
	}
}

// The structure of the data you'll be returning from finds
const fullSchema = buildSchema({
	id: 'unit',
	name: 'Unit',
	fields: {
		id: {
			type: 'id',
			isRequired: true,
		},
		serialNumber: {
			type: 'text',
			label: 'Serial number',
			isRequired: true,
			hint: 'In the form of LUM-0000',
		},
		ram: {
			type: 'select',
			label: 'RAM',
			options: {
				choices: [
					{
						value: '16gb',
						label: '16gb',
					},
					{
						value: '32gb',
						label: '32gb',
					},
					{
						value: '64gb',
						label: '64gb',
					},
				],
			},
		},
		description: {
			type: 'text',
			label: 'Description',
		},
		status: {
			type: 'select',
			label: 'Status',
			defaultValue: 'development',
			options: {
				choices: [
					{
						value: 'up',
						label: 'Up',
					},
					{
						value: 'development',
						label: 'Development',
					},
					{
						value: 'down',
						label: 'Down',
					},
				],
			},
		},
	},
})

// The values you will accept when creating a record
const createSchema = buildSchema({
	id: 'createUnit',
	fields: {
		...dropFields(fullSchema.fields, ['id']),
	},
})

// The values you will accept when updating a record
const updateSchema = buildSchema({
	id: 'updateUnit',
	fields: {
		...makeFieldsOptional(dropFields(fullSchema.fields, ['id'])),
	},
})

// The values you will actually save to the databases (in this case, makes id required)
const databaseSchema = buildSchema({
	id: 'databaseUnit',
	fields: {
		unitid: {
			type: 'id',
			isRequired: true,
		},
		unitcode: {
			type: 'text',
			isRequired: true,
		},
		unitdescription: {
			type: 'text',
		},
		unitstatus: {
			type: 'text',
		},
	},
})

type FullSchema = typeof fullSchema
type CreateSchema = typeof createSchema
type UpdateSchema = typeof updateSchema
type DatabaseSchema = typeof databaseSchema

type Unit = SchemaValues<FullSchema>
type CreateUnit = SchemaValues<CreateSchema>
type UpdateUnit = SchemaValues<UpdateSchema>
type DatabaseUnit = SchemaValues<DatabaseSchema>
// type QueryUnit = Partial<Unit>

type UnitStoreOptions = UniversalStoreOptions

declare module '../../../../types/stores.types' {
	interface StoreMap {
		differentDatabaseSchema: DifferentDatabaseSchemaStore
	}

	interface StoreOptionsMap {
		differentDatabaseSchema: Record<string, never>
	}
}
