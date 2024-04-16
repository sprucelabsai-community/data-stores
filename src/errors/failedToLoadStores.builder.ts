import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'failedToLoadStores',
    name: 'failed to load stores',
    importsWhenLocal: [
        "import AbstractSpruceError from '@sprucelabs/error'",
        "import { FailedToLoadStoreErrorOptions } from '#spruce/errors/options.types'",
    ],
    fields: {
        errors: {
            type: 'raw',
            isRequired: true,
            isArray: true,
            options: {
                valueType: 'AbstractSpruceError<FailedToLoadStoreErrorOptions>',
            },
        },
    },
})
