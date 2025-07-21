import { test, suite, assert, generateId } from '@sprucelabs/test-utils'
import MongoDatabase from '../../databases/MongoDatabase'
import NeDbDatabase from '../../databases/NeDbDatabase'
import StoreFactory from '../../factories/StoreFactory'
import MockStoreFactory from '../../stores/MockStoreFactory'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import { StoreName } from '../../types/stores.types'
import SpyStore from './usingStores/support/SpyStore'

@suite()
export default class AssertingDatabasesAndStoresTest extends AbstractDatabaseTest {
    private factory!: MockStoreFactory
    protected async beforeEach(): Promise<void> {
        await super.beforeEach()

        StoreFactory.Class = MockStoreFactory

        this.db = await this.connectToDatabase()
        this.factory = StoreFactory.Factory(this.db) as MockStoreFactory
    }

    @test()
    protected async assertDbInstanceForDataStoreThrowsByDefault() {
        await this.assertInstanceOfThrows('', {})
    }

    @test()
    protected async passesWhenWithDefaultSettings() {
        this.dropInSpy('spy')
        await this.assertDatabaseForStoreInstanceOf('spy', NeDbDatabase)
    }

    @test()
    protected async throwsIfSpyNameDoesNotMatch() {
        this.dropInSpy('spy')
        await this.assertInstanceOfThrows(generateId(), NeDbDatabase)
    }

    @test()
    protected async throwsIfInstanceOfCheckFails() {
        const name = generateId()
        this.dropInSpy(name)
        await this.assertInstanceOfThrows(name, MongoDatabase)
    }

    @test()
    protected async canCheckOnSubclasses() {
        const name = generateId()
        this.dropInSpy(name)
        const db = new SubClassedNeDbDatabase()
        this.factory.setDatabaseForStore(name as StoreName, db)
        await this.assertDatabaseForStoreInstanceOf(name, NeDbDatabase)
    }

    private async assertDatabaseForStoreInstanceOf(
        name: string,
        Class: typeof NeDbDatabase
    ) {
        await this.factory.assertDatabaseForStoreInstanceOf(
            name as StoreName,
            Class
        )
    }

    private dropInSpy(name: string) {
        this.factory.setStoreClass(name as StoreName, SpyStore)
    }

    private async assertInstanceOfThrows(name: string, Class: any) {
        await assert.doesThrowAsync(() =>
            //@ts-ignore
            this.factory.assertDatabaseForStoreInstanceOf(name, Class)
        )
    }
}

class SubClassedNeDbDatabase extends NeDbDatabase {}
