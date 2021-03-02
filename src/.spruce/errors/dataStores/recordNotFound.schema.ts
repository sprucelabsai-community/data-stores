import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

import recordNotFoundQuerySchema from '#spruce/errors/dataStores/record-not-found-query.schema'

const recordNotFoundSchema: SpruceErrors.DataStores.RecordNotFoundSchema  = {
	id: 'recordNotFound',
	namespace: 'DataStores',
	name: 'Record not found',
	    fields: {
	            /** Store name. */
	            'storeName': {
	                label: 'Store name',
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** Query. */
	            'query': {
	                label: 'Query',
	                type: 'schema',
	                isRequired: true,
	                options: {schema: recordNotFoundQuerySchema,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(recordNotFoundSchema)

export default recordNotFoundSchema
