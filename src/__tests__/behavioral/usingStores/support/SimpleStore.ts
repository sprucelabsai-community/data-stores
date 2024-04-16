import { buildSchema, dropFields, makeFieldsOptional } from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import { UniversalStoreOptions } from '../../../../types/stores.types'

export default class SimpleStore extends AbstractStore<
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

    public willUpdateUpdates?: any
    public willUpdateValues?: any
    public didCreateValues?: any
    public didUpdateValues?: any
    protected shouldMapLowerCaseToCamelCase = true

    public static Store(options: UniversalStoreOptions) {
        return new this(options.db)
    }

    public setShouldMap(should: boolean) {
        this.shouldMapLowerCaseToCamelCase = should
    }
}

declare module '../../../../types/stores.types' {
    interface StoreMap {
        simple: SimpleStore
    }

    interface StoreOptionsMap {
        simple: Record<string, never>
    }
}

const fullRecordSchema = buildSchema({
    id: 'simplePrimary',
    name: 'Schema',
    fields: {
        id: {
            type: 'id',
            isRequired: true,
        },
        sensorName: {
            type: 'text',
            isRequired: true,
        },
        vendorId: {
            type: 'id',
        },
        sensorCode: {
            type: 'id',
        },
        isValid: {
            type: 'boolean',
        },
    },
})
const createRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'simplePrimaryCreate',
    fields: {
        ...dropFields(fullRecordSchema.fields, ['id']),
    },
})
const updateRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'simplePrimaryUpdate',
    fields: {
        ...dropFields(makeFieldsOptional(fullRecordSchema.fields), ['id']),
    },
})
const databaseRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'simplePrimaryDatabase',
    fields: {
        ...fullRecordSchema.fields,
    },
})
export const TEST_COLLECTION_NAME = 'test_collection'

type DatabaseRecordSchema = typeof databaseRecordSchema
