import { test, assert, generateId } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import DatabaseFactory from '../../../factories/DatabaseFactory'
import StoreFactory from '../../../factories/StoreFactory'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import { Database } from '../../../types/database.types'
import { StoreName } from '../../../types/stores.types'
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
        this.dropInSpyStore()

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
        this.dropInSpyStore()
        const store = await this.Store()
        assert.isTrue(store instanceof SpyStore)
    }

    @test()
    protected static async getsDatabaseToStoreAndFactory() {
        this.dropInSpyStore()
        const store = await this.Store()
        assert.isTruthy(store.db)
        assert.isTruthy(store.storeFactory)
    }

    @test()
    protected static async storesGetAdditionalOptions() {
        this.dropInSpyStore()
        const store = await this.factory.Store('spy', { testOption: true })
        assert.isTrue(store.options.testOption)
    }

    @test()
    protected static async factoryReturnsAllStoreNames() {
        let names = this.factory.getStoreNames()

        assert.isLength(names, 0)

        this.dropInSpyStore()

        names = this.factory.getStoreNames()

        assert.isLength(names, 1)
        assert.isEqualDeep(names, ['spy'])

        assert.isExactType<
            typeof names,
            (
                | 'spy'
                | 'dummy'
                | 'operations'
                | 'customPrimary'
                | 'customPrimary2'
                | 'simple'
                | 'customPrimaryWithFieldNamedId'
                | 'differentDatabaseSchema'
            )[]
        >(true)
    }

    @test()
    protected static async initializesStore() {
        this.dropInSpyStore()
        const store = await this.Store()
        assert.isTrue(store.wasInitializedInvoked)
    }

    @test()
    protected static async initializeIsOnlyTriggeredOncePerStoreWith1Factory() {
        this.dropInSpyStore()
        await this.Store()
        await this.Store()
        await this.Store()
        await this.Store()
        assert.isEqual(SpyStore.initializeCount, 1)
    }

    @test()
    protected static async initializeIsOnlyTriggeredOncePerStoreWithMultipleFactories() {
        this.dropInSpyStore()
        await this.Store()
        await this.Store()
        await this.Store()
        await this.Store()

        const factory2 = StoreFactory.Factory(this.db)
        factory2.setStoreClass('spy', SpyStore)

        await factory2.Store('spy')
        await factory2.Store('spy')
        await factory2.Store('spy')
        await factory2.Store('spy')

        assert.isEqual(SpyStore.initializeCount, 1)
    }

    @test()
    protected static async canSetDatabaseBasedOnStoreName() {
        this.dropInSpyStore()
        this.resetDatabaseCache()
        const db = await this.connectToDatabase()
        this.setDatabaseForStore(db)
        const store = await this.Store()
        assert.isEqual(store.db, db)
    }

    @test()
    protected static async doesNoEffectOtherStores() {
        const storeName1 = generateId()
        const storeName2 = generateId()

        const db = this.db
        this.dropInSpyStore(storeName1)
        this.dropInSpyStore(storeName2)
        this.resetDatabaseCache()
        const db2 = await this.connectToDatabase()
        this.setDatabaseForStore(db2, storeName1)

        const store2 = await this.Store(storeName2)
        assert.isEqual(store2.db, db)

        const store1 = await this.Store(storeName1)
        assert.isEqual(store1.db, db2)
    }

    private static async Store(name?: string) {
        return this.factory.Store(
            (name ?? 'spy') as StoreName
        ) as unknown as SpyStore
    }

    private static setDatabaseForStore(db: Database, name?: string) {
        this.factory.setDatabaseForStore((name ?? 'spy') as StoreName, db)
    }

    private static resetDatabaseCache() {
        DatabaseFactory.reset()
        //@ts-ignore
        delete this.db
    }

    private static dropInSpyStore(name?: string) {
        this.factory.setStoreClass((name ?? 'spy') as StoreName, SpyStore)
    }
}
