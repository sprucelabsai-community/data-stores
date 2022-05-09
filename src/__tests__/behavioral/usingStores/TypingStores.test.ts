import { assert, test } from '@sprucelabs/test'
import AbstractStoreTest from './support/AbstractStoreTest'
import SpyStore from './support/SpyStore'

export default class TypingStoresTest extends AbstractStoreTest {
	@test('Will type names (always passes, lint fails)')
	protected static async typesNames() {
		await this.factory.Store('spy')
	}

	@test('Types options (will always pass, fails lint)')
	protected static async typesOptions() {
		await this.factory.Store('spy', { testOption: true })
	}

	@test('Types returned store (will always pass, fails lint)')
	protected static async typesStore() {
		const store = await this.factory.Store('spy', { testOption: true })
		assert.isExactType<SpyStore, typeof store>(true)
	}
}
