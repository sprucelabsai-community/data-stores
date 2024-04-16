import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const notImplementedSchema: SpruceErrors.DataStores.NotImplementedSchema = {
    id: 'notImplemented',
    namespace: 'DataStores',
    name: 'Not implemented',
    fields: {},
}

SchemaRegistry.getInstance().trackSchema(notImplementedSchema)

export default notImplementedSchema
