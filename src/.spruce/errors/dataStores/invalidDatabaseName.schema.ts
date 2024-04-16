import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidDatabaseNameSchema: SpruceErrors.DataStores.InvalidDatabaseNameSchema =
    {
        id: 'invalidDatabaseName',
        namespace: 'DataStores',
        name: 'Invalid database name',
        fields: {
            /** . */
            suppliedName: {
                type: 'text',
                isRequired: true,
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(invalidDatabaseNameSchema)

export default invalidDatabaseNameSchema
