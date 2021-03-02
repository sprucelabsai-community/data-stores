import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
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
		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.factory.Store('not-found')
		)
		errorAssertUtil.assertError(err, 'INVALID_STORE_NAME', {
			suppliedName: 'not-found',
			validNames: [],
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
}
