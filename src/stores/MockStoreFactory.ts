import { assert } from '@sprucelabs/test-utils'
import StoreFactory from '../factories/StoreFactory'
import { Database } from '../types/database.types'
import { StoreName } from '../types/stores.types'

export default class MockStoreFactory extends StoreFactory {
    public constructor(db: Database) {
        super(db)
    }

    public async assertDatabaseForStoreInstanceOf<Name extends StoreName>(
        name: Name,
        Class: new (...opts: any[]) => Database
    ) {
        if (!this.storeMap[name]) {
            assert.fail(
                `I could not find a store named ${name}. Did you create it with 'spruce create.store'?`
            )
        }

        const store = await this.getStore(name)

        assert.isInstanceOf(
            store.getDb(),
            Class,
            `Database for '${name}' store is not set correctly. Try 'stores.setDatabaseForStore(...)`
        )
    }
}
