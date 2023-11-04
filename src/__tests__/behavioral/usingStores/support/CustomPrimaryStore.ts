import { buildSchema, dropFields, makeFieldsOptional } from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import { UniversalStoreOptions } from '../../../../types/stores.types'

export default class CustomPrimaryStore extends AbstractStore<
	typeof fullRecordSchema,
	typeof createRecordSchema,
	typeof updateRecordSchema,
	DatabaseRecordSchema
> {
	public name = 'Test'
	protected scrambleFields = []
	protected collectionName = TEST_COLLECTION_NAME
	protected fullSchema = fullRecordSchema
	protected createSchema = createRecordSchema
	protected updateSchema = updateRecordSchema
	protected databaseSchema = databaseRecordSchema
	protected willScramble = undefined
	protected primaryFieldNames: string[] = ['customId1']

	public willUpdateUpdates?: any
	public willUpdateValues?: any
	public didCreateValues?: any
	public didUpdateValues?: any

	public static Store(options: UniversalStoreOptions) {
		return new this(options.db)
	}
}

declare module '../../../../types/stores.types' {
	interface StoreMap {
		customPrimary: CustomPrimaryStore
	}

	interface StoreOptionsMap {
		customPrimary: Record<string, never>
	}
}

const fullRecordSchema = buildSchema({
	id: 'customPrimary',
	name: 'Schema',
	fields: {
		customId1: {
			type: 'id',
			isRequired: true,
		},

		name: {
			type: 'text',
			isRequired: true,
		},
	},
})
const createRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'customPrimaryCreate',
	fields: {
		...dropFields(fullRecordSchema.fields, ['customId1']),
	},
})
const updateRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'customPrimaryUpdate',
	fields: {
		...dropFields(makeFieldsOptional(fullRecordSchema.fields), ['customId1']),
	},
})
const databaseRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'customPrimaryDatabase',
	fields: {
		...fullRecordSchema.fields,
	},
})
export const TEST_COLLECTION_NAME = 'test_collection'

type DatabaseRecordSchema = typeof databaseRecordSchema
