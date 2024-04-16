import { buildSchema } from '@sprucelabs/schema'
import AbstractStore from '../../../../../stores/AbstractStore'
import { UniversalStoreOptions } from '../../../../../types/stores.types'

const fullSchema = buildSchema({
    id: 'goodFull',
    fields: {},
})

type FullSchema = typeof fullSchema

export default class GoodStore extends AbstractStore<FullSchema> {
    public name = 'good'
    protected collectionName = 'good_stuff'
    protected createSchema = fullSchema
    protected updateSchema = fullSchema
    protected fullSchema = fullSchema
    protected databaseSchema = fullSchema

    public static Store(options: UniversalStoreOptions) {
        return new this(options.db)
    }
}
