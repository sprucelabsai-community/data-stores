import { test, assert } from '@sprucelabs/test'
import DatabaseFactory from '../../factories/DatabaseFactory'
import DatabaseFixture from '../../fixtures/DatabaseFixture'
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
}
