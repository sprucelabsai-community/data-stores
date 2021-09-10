import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const duplicateKeySchema: SpruceErrors.DataStores.DuplicateKeySchema  = {
	id: 'duplicateKey',
	namespace: 'DataStores',
	name: 'Duplicate Key',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(duplicateKeySchema)

export default duplicateKeySchema
