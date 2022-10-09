import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const indexExistsSchema: SpruceErrors.DataStores.IndexExistsSchema  = {
	id: 'indexExists',
	namespace: 'DataStores',
	name: 'Index Exists',
	    fields: {
	            /** Index Exists. */
	            'index': {
	                label: 'Index Exists',
	                type: 'text',
	                isRequired: true,
	                isArray: true,
	                options: undefined
	            },
	            /** . */
	            'collectionName': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(indexExistsSchema)

export default indexExistsSchema
