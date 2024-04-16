import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const unknownErrorSchema: SpruceErrors.DataStores.UnknownErrorSchema = {
    id: 'unknownError',
    namespace: 'DataStores',
    name: 'Unknown Error',
    fields: {},
}

SchemaRegistry.getInstance().trackSchema(unknownErrorSchema)

export default unknownErrorSchema
