import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const mongoIdMappingErrorSchema: SpruceErrors.DataStores.MongoIdMappingErrorSchema =
    {
        id: 'mongoIdMappingError',
        namespace: 'DataStores',
        name: 'Mongo id mapping error',
        fields: {},
    }

SchemaRegistry.getInstance().trackSchema(mongoIdMappingErrorSchema)

export default mongoIdMappingErrorSchema
