import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'unknownError',
    name: 'Unknown Error',
    fields: {},
})
