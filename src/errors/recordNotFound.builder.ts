import { buildErrorSchema, buildSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'recordNotFound',
    name: 'Record not found',
    description: '',
    fields: {
        storeName: {
            type: 'text',
            label: 'Store name',
            isRequired: true,
        },
        query: {
            type: 'schema',
            label: 'Query',
            isRequired: true,
            options: {
                schema: buildSchema({
                    id: 'record-not-found-query',
                    name: 'Search query',
                    dynamicFieldSignature: {
                        keyName: 'field',
                        type: 'raw',
                        options: {
                            valueType: 'any',
                        },
                    },
                }),
            },
        },
    },
})
