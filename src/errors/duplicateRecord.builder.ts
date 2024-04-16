import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'duplicateRecord',
    name: 'Duplicate record',
    description: '',
    fields: {
        duplicateFields: {
            type: 'text',
            isRequired: true,
            isArray: true,
        },
        duplicateValues: {
            type: 'text',
            isRequired: true,
            isArray: true,
        },
        collectionName: {
            type: 'text',
            isRequired: true,
        },
        action: {
            type: 'text',
            label: 'Action',
            hint: 'e.g. create, update, etc.',
            isRequired: true,
        },
    },
})
