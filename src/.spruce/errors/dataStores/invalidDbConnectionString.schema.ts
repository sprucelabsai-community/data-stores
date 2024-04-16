import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidDbConnectionStringSchema: SpruceErrors.DataStores.InvalidDbConnectionStringSchema =
    {
        id: 'invalidDbConnectionString',
        namespace: 'DataStores',
        name: 'Invalid db connection string',
        fields: {},
    }

SchemaRegistry.getInstance().trackSchema(invalidDbConnectionStringSchema)

export default invalidDbConnectionStringSchema
