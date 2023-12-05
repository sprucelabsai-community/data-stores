import { buildSchema, dropFields, makeFieldsOptional } from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import { UniversalStoreOptions } from '../../../../types/stores.types'

export default class CustomPrimaryStoreWithFieldNamedId extends AbstractStore<
	typeof fullRecordSchema,
	typeof createRecordSchema,
	typeof updateRecordSchema,
	DatabaseRecordSchema,
	'anotherCustomId'
> {
	public name = 'CustomPrimaryWithFieldNamedId'
	protected scrambleFields = []
	protected collectionName = TEST_COLLECTION_NAME
	protected fullSchema = fullRecordSchema
	protected createSchema = createRecordSchema
	protected updateSchema = updateRecordSchema
	protected databaseSchema = databaseRecordSchema
	protected willScramble = undefined
	protected primaryFieldNames = ['anotherCustomId' as const]

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
		customPrimaryWithFieldNamedId: CustomPrimaryStoreWithFieldNamedId
	}

	interface StoreOptionsMap {
		customPrimaryWithFieldNamedId: Record<string, never>
	}
}

const fullRecordSchema = buildSchema({
	id: 'customPrimaryWithFieldNamedId',
	name: 'Schema',
	fields: {
		anotherCustomId: {
			type: 'id',
			isRequired: true,
		},
		id: {
			type: 'id',
		},
		name: {
			type: 'text',
			isRequired: true,
		},
	},
})
const createRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'customPrimaryWithFieldNamedIdCreate',
	fields: {
		...dropFields(fullRecordSchema.fields, ['anotherCustomId']),
	},
})
const updateRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'customPrimaryWithFieldNamedIdUpdate',
	fields: {
		...dropFields(makeFieldsOptional(fullRecordSchema.fields), [
			'anotherCustomId',
		]),
	},
})
const databaseRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'customPrimaryWithFieldNamedIdDatabase',
	fields: {
		...fullRecordSchema.fields,
	},
})
export const TEST_COLLECTION_NAME = 'test_collection'

type DatabaseRecordSchema = typeof databaseRecordSchema
