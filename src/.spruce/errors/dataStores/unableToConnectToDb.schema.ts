import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const unableToConnectToDbSchema: SpruceErrors.DataStores.UnableToConnectToDbSchema =
    {
        id: 'unableToConnectToDb',
        namespace: 'DataStores',
        name: 'Unable to connect to db',
        fields: {},
    }

SchemaRegistry.getInstance().trackSchema(unableToConnectToDbSchema)

export default unableToConnectToDbSchema
