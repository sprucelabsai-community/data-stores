import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'unknownDatabaseError',
    name: 'unknown database error',
    description: '',
    fields: {
        databaseErrorMessage: {
            type: 'text',
            isRequired: true,
        },
    },
})
