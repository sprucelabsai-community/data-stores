import {
    buildSchema,
    dropFields,
    dropPrivateFields,
    makeFieldsOptional,
    SchemaValues,
} from '@sprucelabs/schema'
import AbstractStore from '../../../../stores/AbstractStore'
import { UniversalStoreOptions } from '../../../../types/stores.types'

declare module '../../../../types/stores.types' {
    interface StoreMap {
        operations: OperationsStore
    }

    interface StoreOptionsMap {
        operations: Record<string, never>
    }
}

const fullRecordSchema = buildSchema({
    id: 'full-schema',
    name: 'Schema',
    fields: {
        id: {
            type: 'text',
            isRequired: true,
        },
        arrayOfStrings: {
            type: 'text',
            isArray: true,
        },
        arrayOfNumbers: {
            type: 'number',
            isArray: true,
        },
        score: {
            type: 'number',
        },
    },
})
const createRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'create-schema',
    fields: {
        ...makeFieldsOptional(dropFields(fullRecordSchema.fields, ['id'])),
    },
})
const updateRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'update-schema',
    fields: {
        ...dropPrivateFields(createRecordSchema.fields),
    },
})
const databaseRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'database-schema',
    fields: {
        ...fullRecordSchema.fields,
    },
})
export const OPERATIONS_COLLECTION_NAME = 'operations_collection'

type FullRecordSchema = typeof fullRecordSchema
export type OperationsRecord = SchemaValues<FullRecordSchema>

export default class OperationsStore extends AbstractStore<
    FullRecordSchema,
    typeof createRecordSchema,
    typeof updateRecordSchema,
    typeof databaseRecordSchema
> {
    public name = 'Operations'

    protected scrambleFields = []
    protected collectionName = OPERATIONS_COLLECTION_NAME
    protected fullSchema = fullRecordSchema
    protected createSchema = createRecordSchema
    protected updateSchema = updateRecordSchema
    protected databaseSchema = databaseRecordSchema

    protected willScramble = undefined
    public willUpdateUpdates?: any
    public willUpdateValues?: any

    public static Store(options: UniversalStoreOptions) {
        return new this(options.db)
    }
}
