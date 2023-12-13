import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'queryNotFaked',
	name: 'Query not faked',
	fields: {
		query: {
			type: 'text',
			isRequired: true,
		},
		params: {
			type: 'raw',
			options: { valueType: 'Record<string, any>' },
		},
	},
})
