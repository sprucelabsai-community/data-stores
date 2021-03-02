import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const unknownStoreErrorSchema: SpruceErrors.DataStores.UnknownStoreErrorSchema  = {
	id: 'unknownStoreError',
	namespace: 'DataStores',
	name: 'Unknown store error',
	    fields: {
	            /** Action. e.g. createPerson, updateLocation, etc */
	            'action': {
	                label: 'Action',
	                type: 'text',
	                isRequired: true,
	                hint: 'e.g. createPerson, updateLocation, etc',
	                options: undefined
	            },
	            /** Store name. */
	            'storeName': {
	                label: 'Store name',
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(unknownStoreErrorSchema)

export default unknownStoreErrorSchema
