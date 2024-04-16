import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const databaseNotConnectedSchema: SpruceErrors.DataStores.DatabaseNotConnectedSchema =
    {
        id: 'databaseNotConnected',
        namespace: 'DataStores',
        name: 'Database not connected',
        fields: {
            /** . */
            operationAttempted: {
                type: 'text',
                isRequired: true,
                options: undefined,
            },
            /** . */
            collectionName: {
                type: 'text',
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(databaseNotConnectedSchema)

export default databaseNotConnectedSchema
