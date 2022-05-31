import {
	buildSchema,
	dropPrivateFields,
	makeFieldsOptional,
	SchemaValues,
} from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import {
	PrepareOptions,
	PrepareResults,
	UniversalStoreOptions,
} from '../../../../types/stores.types'

declare module '../../../../types/stores.types' {
	interface StoreMap {
		dummy: DummyStore
	}

	interface StoreOptionsMap {
		dummy: Record<string, never>
	}
}

const fullRecordSchema = buildSchema({
	id: 'operations-full-schema',
	name: 'Schema',
	fields: {
		id: {
			type: 'text',
			isRequired: true,
		},
		requiredForCreate: {
			type: 'text',
			isRequired: true,
		},
		requiredForFull: {
			type: 'text',
			isRequired: true,
		},
		requiredForUpdate: {
			type: 'text',
			isRequired: true,
		},
		privateField: {
			type: 'text',
			isPrivate: true,
			isRequired: true,
		},
		phoneNumber: {
			type: 'phone',
			isRequired: true,
		},
		relatedSchema: {
			type: 'schema',
			options: {
				schema: buildSchema({
					id: 'relatedTestSchema',
					fields: {
						textField: { type: 'text' },
						boolField: { type: 'boolean' },
					},
				}),
			},
		},
	},
})
const createRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'operations-create-schema',
	fields: {
		...makeFieldsOptional(fullRecordSchema.fields),
		requiredForCreate: {
			...fullRecordSchema.fields.requiredForCreate,
		},
		phoneNumber: fullRecordSchema.fields.phoneNumber,
	},
})
const updateRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'operations-update-schema',
	fields: {
		...makeFieldsOptional(dropPrivateFields(fullRecordSchema.fields)),
		requiredForUpdate: {
			...fullRecordSchema.fields.requiredForUpdate,
		},
	},
})
const databaseRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'operations-database-schema',
	fields: {
		...fullRecordSchema.fields,
		requiredForDatabase: {
			type: 'boolean',
			isRequired: true,
		},
	},
})
export const TEST_COLLECTION_NAME = 'test_collection'

export default class DummyStore extends AbstractStore<
	typeof fullRecordSchema,
	typeof createRecordSchema,
	typeof updateRecordSchema,
	typeof databaseRecordSchema
> {
	public name = 'Test'

	protected scrambleFields = [
		'requiredForCreate',
		'requiredForFull',
		'requiredForUpdate',
		'privateField',
		'phoneNumber',
	]
	protected collectionName = TEST_COLLECTION_NAME
	protected fullSchema = fullRecordSchema
	protected createSchema = createRecordSchema
	protected updateSchema = updateRecordSchema
	protected databaseSchema = databaseRecordSchema

	protected willScramble = undefined
	public willUpdateUpdates?: any
	public willUpdateValues?: any

	protected async willCreate(values: SchemaValues<typeof createRecordSchema>) {
		return {
			...values,
			requiredForCreate: values.requiredForCreate ?? 'generate for create',
			requiredForDatabase: true,
			requiredForFull: values.requiredForFull ?? 'generated for full',
			requiredForUpdate: values.requiredForUpdate ?? 'generated for update',
			privateField: values.privateField ?? 'generated for privateField',
		}
	}

	protected async willUpdate(
		updates: SchemaValues<typeof updateRecordSchema>,
		values: SchemaValues<typeof databaseRecordSchema>
	) {
		this.willUpdateUpdates = updates
		this.willUpdateValues = values

		return updates as any
	}

	protected async prepareRecord<IncludePrivateFields extends boolean>(
		record: SchemaValues<typeof createRecordSchema>,
		_options?: PrepareOptions<IncludePrivateFields, typeof fullRecordSchema>
	) {
		const values: Record<string, any> = {
			...record,
			requiredForCreate: record.requiredForCreate || 'added here',
			requiredForUpdate: record.requiredForUpdate || 'added there',
			requiredForFull: record.requiredForFull || 'here it is!',
		}

		return values as PrepareResults<
			typeof fullRecordSchema,
			IncludePrivateFields
		>
	}

	public static Store(options: UniversalStoreOptions) {
		return new this(options.db)
	}
}
