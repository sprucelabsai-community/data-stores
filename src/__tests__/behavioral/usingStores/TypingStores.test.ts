import { assert, suite, test } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import SpyStore from './support/SpyStore'

@suite()
export default class TypingStoresTest extends AbstractStoreTest {
    @test('Will type names (always passes, lint fails)')
    protected async typesNames() {
        await this.stores.Store('spy')
    }

    @test('Types options (will always pass, fails lint)')
    protected async typesOptions() {
        await this.stores.Store('spy', { testOption: true })
    }

    @test('Types returned store (will always pass, fails lint)')
    protected async typesStore() {
        const store = await this.stores.Store('spy', { testOption: true })
        assert.isExactType<SpyStore, typeof store>(true)
    }

    @test()
    protected async typesSaveOperations() {
        const store = await this.stores.Store('spy')
        await store.update({}, { $push: { firstName: '1' } })
    }
}
