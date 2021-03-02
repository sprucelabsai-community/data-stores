import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'databaseNotConnected',
	name: 'Database not connected',
	description: '',
	fields: {
		operationAttempted: {
			type: 'text',
			label: 'Operation Attempted',
			isRequired: true,
		},
	},
})
