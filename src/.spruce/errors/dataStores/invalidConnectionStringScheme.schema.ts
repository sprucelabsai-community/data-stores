import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidConnectionStringSchemeSchema: SpruceErrors.DataStores.InvalidConnectionStringSchemeSchema =
    {
        id: 'invalidConnectionStringScheme',
        namespace: 'DataStores',
        name: 'Invalid connection string scheme',
        fields: {
            /** . */
            connectionString: {
                type: 'text',
                isRequired: true,
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(invalidConnectionStringSchemeSchema)

export default invalidConnectionStringSchemeSchema
