import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const unknownDatabaseErrorSchema: SpruceErrors.DataStores.UnknownDatabaseErrorSchema =
    {
        id: 'unknownDatabaseError',
        namespace: 'DataStores',
        name: 'unknown database error',
        fields: {
            /** . */
            databaseErrorMessage: {
                type: 'text',
                isRequired: true,
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(unknownDatabaseErrorSchema)

export default unknownDatabaseErrorSchema
