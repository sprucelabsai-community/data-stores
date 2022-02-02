import { SchemaRegistry } from '@sprucelabs/schema'
import AbstractSpruceTest from '@sprucelabs/test'
import DatabaseFixture, {
	DatabaseFixtureOptions,
} from '../fixtures/DatabaseFixture'
import { Database } from '../types/database.types'

export default class AbstractDatabaseTest extends AbstractSpruceTest {
	protected static db: Database
	protected static shouldUseInMemoryDatabase = true
	protected static DB_NAME: string

	protected static async beforeEach() {
		await super.beforeEach()
		SchemaRegistry.getInstance().forgetAllSchemas()
	}

	protected static async afterEach() {
		await super.afterEach()
		await DatabaseFixture.destroy()

		//@ts-ignore
		this.db = undefined
		//@ts-ignore
		this.DB_NAME = undefined
	}

	protected static async DatabaseFixture(options?: DatabaseFixtureOptions) {
		const d = new DatabaseFixture({
			...options,
		})

		return d
	}

	protected static async connectToDatabase() {
		if (!this.db) {
			const dbFixture = await this.DatabaseFixture()
			const db = await dbFixture.connectToDatabase()

			this.DB_NAME = this.shouldUseInMemoryDatabase ? '' : dbFixture.getDbName()
			this.db = db
		}

		return this.db
	}
}
