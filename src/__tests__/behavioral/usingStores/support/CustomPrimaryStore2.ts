import { buildSchema, dropFields, makeFieldsOptional } from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import { UniversalStoreOptions } from '../../../../types/stores.types'

export default class CustomPrimaryStore2 extends AbstractStore<
    typeof fullRecordSchema,
    typeof createRecordSchema,
    typeof updateRecordSchema,
    DatabaseRecordSchema,
    'anotherCustomId'
> {
    public name = 'CustomPrimary2'
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
        customPrimary2: CustomPrimaryStore2
    }

    interface StoreOptionsMap {
        customPrimary2: Record<string, never>
    }
}

const fullRecordSchema = buildSchema({
    id: 'customPrimary2',
    name: 'Schema',
    fields: {
        anotherCustomId: {
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
    id: 'customPrimaryCreate2',
    fields: {
        ...dropFields(fullRecordSchema.fields, ['anotherCustomId']),
    },
})
const updateRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'customPrimaryUpdate2',
    fields: {
        ...dropFields(makeFieldsOptional(fullRecordSchema.fields), [
            'anotherCustomId',
        ]),
    },
})
const databaseRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'customPrimaryDatabase2',
    fields: {
        ...fullRecordSchema.fields,
    },
})
export const TEST_COLLECTION_NAME = 'test_collection'

type DatabaseRecordSchema = typeof databaseRecordSchema
