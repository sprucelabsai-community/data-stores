import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidStoreNameSchema: SpruceErrors.DataStores.InvalidStoreNameSchema = {
    id: 'invalidStoreName',
    namespace: 'DataStores',
    name: 'Invalid store',
    fields: {
        /** . */
        suppliedName: {
            type: 'text',
            isRequired: true,
            options: undefined,
        },
        /** . */
        validNames: {
            type: 'text',
            isRequired: true,
            isArray: true,
            options: undefined,
        },
    },
}

SchemaRegistry.getInstance().trackSchema(invalidStoreNameSchema)

export default invalidStoreNameSchema
