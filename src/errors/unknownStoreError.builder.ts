import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'unknownStoreError',
    name: 'Unknown store error',
    description: '',
    fields: {
        action: {
            type: 'text',
            label: 'Action',
            isRequired: true,
            hint: 'e.g. createPerson, updateLocation, etc',
        },
        storeName: {
            type: 'text',
            label: 'Store name',
            isRequired: true,
        },
    },
})
