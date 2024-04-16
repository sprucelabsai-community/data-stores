import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const indexNotFoundSchema: SpruceErrors.DataStores.IndexNotFoundSchema = {
    id: 'indexNotFound',
    namespace: 'DataStores',
    name: 'Index not found',
    fields: {
        /** Missing Index. */
        missingIndex: {
            label: 'Missing Index',
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
    },
}

SchemaRegistry.getInstance().trackSchema(indexNotFoundSchema)

export default indexNotFoundSchema
