import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'failedToLoadStore',
    name: 'Failed to load store',
    description: '',
    fields: {
        name: {
            type: 'text',
            isRequired: true,
        },
    },
})
