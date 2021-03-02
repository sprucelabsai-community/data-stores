import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const databaseNotConnectedSchema: SpruceErrors.DataStores.DatabaseNotConnectedSchema  = {
	id: 'databaseNotConnected',
	namespace: 'DataStores',
	name: 'Database not connected',
	    fields: {
	            /** Operation Attempted. */
	            'operationAttempted': {
	                label: 'Operation Attempted',
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(databaseNotConnectedSchema)

export default databaseNotConnectedSchema
