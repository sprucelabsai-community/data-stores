import { assert, test } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import SpyStore from './support/SpyStore'

export default class TypingStoresTest extends AbstractStoreTest {
	@test('Will type names (always passes, lint fails)')
	protected static async typesNames() {
		await this.stores.Store('spy')
	}

	@test('Types options (will always pass, fails lint)')
	protected static async typesOptions() {
		await this.stores.Store('spy', { testOption: true })
	}

	@test('Types returned store (will always pass, fails lint)')
	protected static async typesStore() {
		const store = await this.stores.Store('spy', { testOption: true })
		assert.isExactType<SpyStore, typeof store>(true)
	}

	@test()
	protected static async typesSaveOperations() {
		const store = await this.stores.Store('spy')
		await store.update({}, { $push: { firstName: '1' } })
	}
}
