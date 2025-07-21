import { SchemaRegistry } from '@sprucelabs/schema'
import AbstractSpruceTest from '@sprucelabs/test-utils'
import DatabaseFixture, {
    DatabaseFixtureOptions,
} from '../fixtures/DatabaseFixture'
import { Database } from '../types/database.types'

export default class AbstractDatabaseTest extends AbstractSpruceTest {
    protected db!: Database
    protected shouldUseInMemoryDatabase = true
    protected DB_NAME!: string

    protected async beforeEach() {
        await super.beforeEach()
        SchemaRegistry.getInstance().forgetAllSchemas()
    }

    protected async afterEach() {
        await super.afterEach()
        await DatabaseFixture.destroy()

        //@ts-ignore
        this.db = undefined
        //@ts-ignore
        this.DB_NAME = undefined
    }

    protected async DatabaseFixture(options?: DatabaseFixtureOptions) {
        const d = new DatabaseFixture({
            ...options,
        })

        return d
    }

    protected async connectToDatabase() {
        if (!this.db) {
            const { dbFixture, db } = await this.DatabaseConnection()

            this.DB_NAME = this.shouldUseInMemoryDatabase
                ? ''
                : dbFixture.getDbName()
            this.db = db
        }

        return this.db
    }

    protected async DatabaseConnection() {
        const dbFixture = await this.DatabaseFixture()
        const db = await dbFixture.connectToDatabase()
        return { dbFixture, db }
    }
}
