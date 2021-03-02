import { test } from '@sprucelabs/test'
import StoreFactory from '../../factories/StoreFactory'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import TestStore from '../support/TestStore'

declare module '../../types/stores.types' {
	interface StoreMap {
		test: TestStore
	}

	interface StoreOptionsMap {
		test: { testOption: boolean }
	}
}

export default class TypingStoresTest extends AbstractDatabaseTest {
	private static factory: StoreFactory
	protected static async beforeEach() {
		await super.beforeEach()
		this.factory = StoreFactory.Factory(this.db)
		this.factory.setStore('test', TestStore)
	}

	@test('Will type names (always passes, lint fails)')
	protected static async typesNames() {
		await this.factory.Store('test')
	}

	@test('Types options (will always pass, fails lint)')
	protected static async typesOptions() {
		await this.factory.Store('test', { testOption: true })
	}
}
