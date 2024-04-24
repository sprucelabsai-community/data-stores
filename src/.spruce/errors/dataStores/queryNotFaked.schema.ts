import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const queryNotFakedSchema: SpruceErrors.DataStores.QueryNotFakedSchema  = {
	id: 'queryNotFaked',
	namespace: 'DataStores',
	name: 'Query not faked',
	    fields: {
	            /** . */
	            'query': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'params': {
	                type: 'raw',
	                options: {valueType: `Record<string, any>`,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(queryNotFakedSchema)

export default queryNotFakedSchema
