import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import StoreFactory from '../../../factories/StoreFactory'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import SpyStore from './support/SpyStore'

class BadTestStore {}

export default class BuildingStoresTest extends AbstractDatabaseTest {
	private static factory: StoreFactory
	protected static async beforeEach() {
		await this.connectToDatabase()
		this.factory = StoreFactory.Factory(this.db)
		SpyStore.initializeCount = 0
		StoreFactory.reset()
	}

	@test()
	protected static canCreateStoreFactory() {
		assert.isTruthy(this.factory)
	}

	@test()
	protected static async throwsWithBadStore() {
		this.factory.setStoreClass('spy', SpyStore)

		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.factory.Store('not-found')
		)
		errorAssert.assertError(err, 'INVALID_STORE_NAME', {
			suppliedName: 'not-found',
			validNames: ['spy'],
		})
	}

	@test()
	protected static async throwsWithOutStoreFactoryMethod() {
		//@ts-ignore
		this.factory.setStoreClass('spy', BadTestStore)

		const err = await assert.doesThrowAsync(() => this.factory.Store('spy'))
		errorAssert.assertError(err, 'INVALID_STORE')
		assert.doesInclude(err.message, 'factory')
	}

	@test()
	protected static async canSetStore() {
		this.factory.setStoreClass('spy', SpyStore)
		const store = await this.factory.Store('spy')
		assert.isTrue(store instanceof SpyStore)
	}

	@test()
	protected static async getsDatabaseToStoreAndFactory() {
		this.factory.setStoreClass('spy', SpyStore)
		const store = await this.factory.Store('spy')
		assert.isTruthy(store.db)
		assert.isTruthy(store.storeFactory)
	}

	@test()
	protected static async storesGetAdditionalOptions() {
		this.factory.setStoreClass('spy', SpyStore)
		const store = await this.factory.Store('spy', { testOption: true })
		assert.isTrue(store.options.testOption)
	}

	@test()
	protected static async factoryReturnsAllStoreNames() {
		let names = this.factory.getStoreNames()

		assert.isLength(names, 0)

		this.factory.setStoreClass('spy', SpyStore)

		names = this.factory.getStoreNames()

		assert.isLength(names, 1)
		assert.isEqualDeep(names, ['spy'])

		assert.isExactType<
			typeof names,
			('spy' | 'dummy' | 'operations' | 'customPrimary' | 'customPrimary2')[]
		>(true)
	}

	@test()
	protected static async initializesStore() {
		this.factory.setStoreClass('spy', SpyStore)
		const store = await this.factory.Store('spy')
		assert.isTrue(store.wasInitializedInvoked)
	}

	@test()
	protected static async initializeIsOnlyTriggeredOncePerStoreWith1Factory() {
		this.factory.setStoreClass('spy', SpyStore)
		await this.factory.Store('spy')
		await this.factory.Store('spy')
		await this.factory.Store('spy')
		await this.factory.Store('spy')
		assert.isEqual(SpyStore.initializeCount, 1)
	}

	@test()
	protected static async initializeIsOnlyTriggeredOncePerStoreWithMultipleFactories() {
		this.factory.setStoreClass('spy', SpyStore)
		await this.factory.Store('spy')
		await this.factory.Store('spy')
		await this.factory.Store('spy')
		await this.factory.Store('spy')

		const factory2 = StoreFactory.Factory(this.db)
		factory2.setStoreClass('spy', SpyStore)

		await factory2.Store('spy')
		await factory2.Store('spy')
		await factory2.Store('spy')
		await factory2.Store('spy')

		assert.isEqual(SpyStore.initializeCount, 1)
	}
}
