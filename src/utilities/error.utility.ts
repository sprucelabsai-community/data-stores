import AbstractSpruceError from '@sprucelabs/error'
import SpruceError from '../errors/SpruceError'

const errorUtil = {
    transformToSpruceErrors(
        err: SpruceError | Error | Record<string, any>,
        fallbackErrorWhenUnableToMapToSpruceError?: SpruceError
    ): SpruceError[] {
        if (err instanceof AbstractSpruceError) {
            return [err]
        } else if (!(err instanceof Error)) {
            const e = AbstractSpruceError.parse(err, SpruceError)
            return [e]
        }

        const fallback =
            err instanceof AbstractSpruceError
                ? [err]
                : [
                      fallbackErrorWhenUnableToMapToSpruceError ??
                          new SpruceError({
                              code: 'UNKNOWN_ERROR',
                              originalError: err,
                          }),
                  ]

        return fallback
    },
}

export default errorUtil
