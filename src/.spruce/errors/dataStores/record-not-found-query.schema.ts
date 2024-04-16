import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const recordNotFoundQuerySchema: SpruceErrors.DataStores.RecordNotFoundQuerySchema =
    {
        id: 'record-not-found-query',
        namespace: 'DataStores',
        name: 'Search query',
        dynamicFieldSignature: {
            type: 'raw',
            keyName: 'field',
            options: { valueType: `any` },
        },
    }

SchemaRegistry.getInstance().trackSchema(recordNotFoundQuerySchema)

export default recordNotFoundQuerySchema
