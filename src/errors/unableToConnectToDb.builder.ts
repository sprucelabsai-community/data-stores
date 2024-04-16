import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'unableToConnectToDb',
    name: 'Unable to connect to db',
    description: '',
    fields: {},
})
