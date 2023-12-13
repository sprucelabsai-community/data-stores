import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidFakeQueryResponseSchema: SpruceErrors.DataStores.InvalidFakeQueryResponseSchema  = {
	id: 'invalidFakeQueryResponse',
	namespace: 'DataStores',
	name: 'Invalid fake query response',
	    fields: {
	            /** . */
	            'query': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'response': {
	                type: 'raw',
	                isRequired: true,
	                options: {valueType: `any`,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidFakeQueryResponseSchema)

export default invalidFakeQueryResponseSchema
