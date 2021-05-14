import { errorAssertUtil } from '@sprucelabs/test-utils'
import { test, assert } from '@sprucelabs/test'
import StoreFactory from '../../factories/StoreFactory'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import TestStore from '../support/TestStore'

class BadTestStore {}

export default class BuildingStoresTest extends AbstractDatabaseTest {
	private static factory: StoreFactory
	protected static async beforeEach() {
		await this.connectToDatabase()
		this.factory = StoreFactory.Factory(this.db)
	}

	@test()
	protected static canCreateStoreFactory() {
		assert.isTruthy(this.factory)
	}

	@test()
	protected static async throwsWithBadStore() {
		this.factory.setStore('test', TestStore)

		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.factory.Store('not-found')
		)
		errorAssertUtil.assertError(err, 'INVALID_STORE_NAME', {
			suppliedName: 'not-found',
			validNames: ['test'],
		})
	}

	@test()
	protected static async throwsWithOutStoreFactoryMethod() {
		//@ts-ignore
		this.factory.setStore('test', BadTestStore)

		const err = await assert.doesThrowAsync(() => this.factory.Store('test'))
		errorAssertUtil.assertError(err, 'INVALID_STORE')
		assert.doesInclude(err.message, 'factory')
	}

	@test()
	protected static async canSetStore() {
		this.factory.setStore('test', TestStore)
		const store = await this.factory.Store('test')
		assert.isTrue(store instanceof TestStore)
	}

	@test()
	protected static async getsDatabaseToStoreAndFactory() {
		this.factory.setStore('test', TestStore)
		const store = await this.factory.Store('test')
		assert.isTruthy(store.db)
		assert.isTruthy(store.storeFactory)
	}

	@test()
	protected static async storesGetAdditionalOptions() {
		this.factory.setStore('test', TestStore)
		const store = await this.factory.Store('test', { testOption: true })
		assert.isTrue(store.options.testOption)
	}

	@test()
	protected static async factoryReturnsAllStoreNames() {
		let names = this.factory.getStoreNames()

		assert.isLength(names, 0)

		this.factory.setStore('test', TestStore)

		names = this.factory.getStoreNames()

		assert.isLength(names, 1)
		assert.isEqualDeep(names, ['test'])

		assert.isExactType<typeof names, ('test' | 'testing')[]>(true)
	}

	@test()
	protected static async initializesStore() {
		this.factory.setStore('test', TestStore)
		const store = await this.factory.Store('test')
		assert.isTrue(store.wasInitializedInvoked)
	}
}
