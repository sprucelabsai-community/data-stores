import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'indexExists',
    name: 'Index Exists',
    description: '',
    fields: {
        index: {
            type: 'text',
            label: 'Index Exists',
            isArray: true,
            isRequired: true,
        },
        collectionName: {
            type: 'text',
            isRequired: true,
        },
    },
})
