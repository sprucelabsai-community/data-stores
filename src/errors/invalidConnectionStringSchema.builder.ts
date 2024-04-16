import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidConnectionStringScheme',
    name: 'Invalid connection string scheme',
    fields: {
        connectionString: {
            type: 'text',
            isRequired: true,
        },
    },
})
