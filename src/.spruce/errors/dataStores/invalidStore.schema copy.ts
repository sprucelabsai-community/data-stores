import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidStoreSchema: SpruceErrors.DataStores.InvalidStoreSchema = {
    id: 'invalidStore',
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

SchemaRegistry.getInstance().trackSchema(invalidStoreSchema)

export default invalidStoreSchema
