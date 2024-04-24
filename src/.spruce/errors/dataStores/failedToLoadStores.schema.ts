import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const failedToLoadStoresSchema: SpruceErrors.DataStores.FailedToLoadStoresSchema  = {
	id: 'failedToLoadStores',
	namespace: 'DataStores',
	name: 'failed to load stores',
	    fields: {
	            /** . */
	            'errors': {
	                type: 'raw',
	                isRequired: true,
	                isArray: true,
	                options: {valueType: `AbstractSpruceError<FailedToLoadStoreErrorOptions>`,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(failedToLoadStoresSchema)

export default failedToLoadStoresSchema
