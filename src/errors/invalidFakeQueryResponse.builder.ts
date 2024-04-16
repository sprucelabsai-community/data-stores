import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidFakeQueryResponse',
    name: 'Invalid fake query response',
    fields: {
        query: {
            type: 'text',
            isRequired: true,
        },
        response: {
            type: 'raw',
            isRequired: true,
            options: {
                valueType: 'any',
            },
        },
    },
})
