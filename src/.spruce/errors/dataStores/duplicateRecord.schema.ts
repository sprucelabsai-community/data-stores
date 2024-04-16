import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const duplicateRecordSchema: SpruceErrors.DataStores.DuplicateRecordSchema = {
    id: 'duplicateRecord',
    namespace: 'DataStores',
    name: 'Duplicate record',
    fields: {
        /** . */
        duplicateFields: {
            type: 'text',
            isRequired: true,
            isArray: true,
            options: undefined,
        },
        /** . */
        duplicateValues: {
            type: 'text',
            isRequired: true,
            isArray: true,
            options: undefined,
        },
        /** . */
        collectionName: {
            type: 'text',
            isRequired: true,
            options: undefined,
        },
        /** Action. e.g. create, update, etc. */
        action: {
            label: 'Action',
            type: 'text',
            isRequired: true,
            hint: 'e.g. create, update, etc.',
            options: undefined,
        },
    },
}

SchemaRegistry.getInstance().trackSchema(duplicateRecordSchema)

export default duplicateRecordSchema
