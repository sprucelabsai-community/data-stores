import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const scrambleNotConfiguredSchema: SpruceErrors.DataStores.ScrambleNotConfiguredSchema  = {
	id: 'scrambleNotConfigured',
	namespace: 'DataStores',
	name: 'Scramble not configured',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(scrambleNotConfiguredSchema)

export default scrambleNotConfiguredSchema
