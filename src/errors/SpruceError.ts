import AbstractSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends AbstractSpruceError<ErrorOptions> {
    public friendlyMessage(): string {
        const { options } = this
        let message

        switch (options?.code) {
            case 'DATABASE_NOT_CONNECTED':
                message = `Oh no! I could not ${options.operationAttempted}${
                    options.collectionName
                        ? ` I tried this on the '${options.collectionName}' collection.`
                        : ''
                }`
                break

            case 'DUPLICATE_RECORD': {
                const duplicates: string[] = []

                for (let c = 0; c < options.duplicateFields.length; c++) {
                    const field = options.duplicateFields[c]
                    const value = options.duplicateValues[c]
                    duplicates.push(`${field} (${JSON.stringify(value)})`)
                }

                return `One or more ${
                    options.collectionName
                } already have the ${duplicates.join(' and ')} you provided.`
            }

            case 'UNKNOWN_STORE_ERROR':
                message = `An unknown error occurred in the ${options.storeName} store. The original error is: \n\n${options.originalError?.stack ?? options.originalError?.message}`
                break

            case 'RECORD_NOT_FOUND':
                message = `I looked through all ${options.storeName} and couldn't find what you're looking for.`
                break

            case 'MONGO_ID_MAPPING_ERROR':
                message = `A query was run where the id was not a string: \n\n${options.friendlyMessage}`
                break

            case 'SCRAMBLE_NOT_CONFIGURED':
                message = 'A Scramble not configured just happened!'
                break

            case 'INVALID_STORE':
                message =
                    options.friendlyMessage ??
                    `The store you passed does not extend AbstractStore!`
                break

            case 'INVALID_STORE_NAME':
                message = `I couldn't find a store named '${options.suppliedName}'. `
                if (options.validNames.length === 0) {
                    message += 'There are actually no stores available.'
                } else {
                    message += `Valid names are:\n\n`
                    message += options.validNames.join('\n')
                }

                message += `\n\nIf you are testing, you may need to run 'spruce create.store' to fix this.\n\n`
                break

            case 'FAILED_TO_LOAD_STORE':
                message = `Dang it, I couldn't load your ${options.name} store!`
                if (options.originalError) {
                    message +=
                        '\n\nOriginal error:\n\n' +
                        options.originalError.message
                }
                break

            case 'INVALID_DB_CONNECTION_STRING':
                message = 'The database connection string you sent is no good!'
                if (options.originalError) {
                    message +=
                        '\n\nOriginal error:\n\n' +
                        options.originalError.message
                }
                break

            case 'UNKNOWN_DATABASE_ERROR':
                message = `Something went wrong with the database, the message is:\n\n"${options.databaseErrorMessage}"`
                break

            case 'UNABLE_TO_CONNECT_TO_DB':
                message = `I could not connect to a dabatase. Installing mongo is a great first step to solving this!

https://www.mongodb.com/try/download/community 

If you are on a mac, using brew is recommended: https://brew.sh`
                break

            case 'FAILED_TO_LOAD_STORES': {
                const totalErrors = options.errors.length
                message = `Shoot! I couldn't load your data stores. Found ${totalErrors} error${
                    totalErrors === 1 ? '' : 's'
                }:\n\n`

                for (const err of options.errors) {
                    message += `${err.message}\n`
                }

                break
            }

            case 'INVALID_DATABASE_NAME':
                message = `Halt! '${options.suppliedName}' database not found! Make sure it exists or if you're using Mongo, make sure it's a valid name (no funky chars).`
                break

            case 'INDEX_NOT_FOUND':
                message = `The unique index ${options.missingIndex.join(
                    ', '
                )} you tried to remove does not exist!`
                break

            case 'INDEX_EXISTS':
                message = `The unique index ${options.index.join(
                    ', '
                )} you attempted to create in '${
                    options.collectionName
                }' already exists!`
                break

            case 'UNKNOWN_ERROR':
                message = 'Unknown error!'
                break

            case 'DUPLICATE_KEY':
                message = `An index was trying to be created that exists. Original error is:\n\n${
                    options.friendlyMessage ??
                    options.originalError?.stack ??
                    options.originalError?.message
                }`
                break

            case 'INVALID_CONNECTION_STRING_SCHEME':
                message = `There is no database adapter setup for: ${
                    options.connectionString.split('://')[0]
                }. You may need to install a plugin to support this database using env.DB_ADAPTER and 'yarn add ...'`
                break

            case 'NOT_IMPLEMENTED':
                message = 'A Not implemented just happened!'
                break

            case 'QUERY_NOT_FAKED':
                message = `The query '${options.query}' was not faked. Try this.db.fakeQuery(...).`
                break

            case 'INVALID_FAKE_QUERY_RESPONSE':
                message = `The query '${options.query}' was faked but the response was not an array. Make sure this.db.fakeQuery('${options.query}', () => []) returns an array.`
                break

            default:
                message = super.friendlyMessage()
        }

        const fullMessage = options.friendlyMessage ?? message

        return fullMessage
    }
}
