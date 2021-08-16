import { test, assert } from '@sprucelabs/test'
import DatabaseFactory from '../../factories/DatabaseFactory'
import DatabaseFixture from '../../fixtures/DatabaseFixture'
import StoreLoader from '../../loaders/StoreLoader'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'

export default class DatabaseFixtureTest extends AbstractDatabaseTest {
	@test()
	protected static async fixtureClearsDatabaseCacheOnDestroy() {
		const databaseFixture = new DatabaseFixture()
		await databaseFixture.connectToDatabase()

		await DatabaseFixture.destroy()

		//@ts-ignore
		assert.isLength(Object.keys(DatabaseFactory.cache), 0)
	}

	@test()
	protected static async storeLoaderInstanceResetWhenDatabaseFixtureDestroyed() {
		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		StoreLoader.setStoreDir(this.cwd)
		StoreLoader.setDatabase(db)

		const loader1 = await StoreLoader.getInstance()
		await DatabaseFixture.destroy()

		const loader2 = await StoreLoader.getInstance()

		assert.isNotEqual(loader1, loader2)
	}
}
