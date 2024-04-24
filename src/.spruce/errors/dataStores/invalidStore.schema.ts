import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidStoreSchema: SpruceErrors.DataStores.InvalidStoreSchema  = {
	id: 'invalidStore',
	namespace: 'DataStores',
	name: 'Invalid store',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidStoreSchema)

export default invalidStoreSchema
