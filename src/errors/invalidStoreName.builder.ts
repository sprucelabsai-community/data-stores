import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidStoreName',
    name: 'Invalid store',
    fields: {
        suppliedName: {
            type: 'text',
            isRequired: true,
        },
        validNames: {
            type: 'text',
            isRequired: true,
            isArray: true,
        },
    },
})
