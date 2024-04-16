import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidDatabaseName',
    name: 'Invalid database name',
    description: '',
    fields: {
        suppliedName: {
            type: 'text',
            isRequired: true,
        },
    },
})
