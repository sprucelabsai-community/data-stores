import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'indexNotFound',
	name: 'Index not found',
	description: '',
	fields: {
		missingIndex: {
			type: 'text',
			label: 'Missing Index',
			isArray: true,
			isRequired: true,
		},
		collectionName: {
			type: 'text',
			isRequired: true,
		},
	},
})
