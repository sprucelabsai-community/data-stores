import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidDbConnectionString',
    name: 'Invalid db connection string',
    description: '',
    fields: {},
})
