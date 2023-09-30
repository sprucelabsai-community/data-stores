import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
} from '@sprucelabs/test-utils'
import MongoDatabase from '../../../databases/MongoDatabase'
import NeDbDatabase from '../../../databases/NeDbDatabase'
import DatabaseFactory, {
	DatabaseConstructor,
} from '../../../factories/DatabaseFactory'
import generateId from '../../../utilities/generateId'

export default class ConnectingToADatabaseTest extends AbstractSpruceTest {
	@test()
	protected static async sameSettingsSharesIntsanceWhenMemory() {
		this.assertSameInstanceReturned('memory', 'memory://')
		this.assertSameInstanceReturned(generateId(), 'memory://')
		this.assertSameInstanceReturned(undefined, 'memory://')
		this.assertSameInstanceReturned('memory', 'memory://', undefined)
		this.assertSameInstanceReturned(generateId(), 'memory://', undefined)
		this.assertSameInstanceReturned(undefined, 'memory://', undefined)
	}

	@test()
	protected static async twoInMemoryConnectionsShareInstances() {
		const db1 = DatabaseFactory.Database({
			dbName: 'test1',
			dbConnectionString: 'memory://',
		})
		const db2 = DatabaseFactory.Database({
			dbName: 'test2',
			dbConnectionString: 'memory://',
		})

		assert.isNotEqual(db1, db2)
	}

	@test()
	protected static async doesNotConfuseMemoryForNotMemoryDbs() {
		const db1 = DatabaseFactory.Database({
			dbName: 'test1',
			dbConnectionString: 'mongodb://localhost:27017',
		})
		const db2 = DatabaseFactory.Database({
			dbConnectionString: 'memory://',
		})

		assert.isNotEqual(db1, db2)
	}

	@test()
	protected static async supportsMongoSrvSchemes() {
		const db = DatabaseFactory.Database({
			dbName: 'test1',
			dbConnectionString: 'mongodb+srv://localhost',
		})

		assert.isInstanceOf(db, MongoDatabase)
	}

	@test()
	protected static async throwsWithBadConnectionScheme() {
		const connectionString = `${generateId()}://localhost:27017`
		const err = assert.doesThrow(() => {
			DatabaseFactory.Database({
				dbConnectionString: connectionString,
			})
		})

		errorAssert.assertError(err, 'INVALID_CONNECTION_STRING_SCHEME', {
			connectionString,
		})
	}

	@test()
	protected static async canSetAdapterOnFactory() {
		this.assertCanSetAdapter('postgres://', MongoDatabase)
		this.assertCanSetAdapter('cheesey://', NeDbDatabase)
	}

	private static assertCanSetAdapter(schema: string, Db: DatabaseConstructor) {
		DatabaseFactory.addAdapter(schema, Db)
		this.assertAdapterSet(schema, Db)
	}

	private static assertAdapterSet(schema: string, Db: DatabaseConstructor) {
		//@ts-ignore
		assert.isEqual(DatabaseFactory.Adapters[schema], Db)
	}

	private static assertSameInstanceReturned(
		dbName1: any,
		connection: any,
		dbName2?: any
	) {
		const db1 = this.Database(dbName1, connection)
		const db2 = this.Database(dbName2 ?? dbName1, connection)
		assert.isEqual(db1, db2)
	}

	private static Database(dbName1: string, connection: string) {
		return DatabaseFactory.Database({
			dbName: dbName1,
			dbConnectionString: connection,
		})
	}
}
