import MongoDatabase, { MONGO_TEST_URI } from '../../databases/MongoDatabase'
import { TestConnect } from '../../types/database.types'

let dbCount = 0

const mongoConnect: TestConnect = async (
	dbConnectionString = MONGO_TEST_URI,
	dbName?: string
) => {
	const name = dbName ?? `mercury_${new Date().getTime()}-${dbCount++}`
	const database = new MongoDatabase(dbConnectionString, { dbName: name })

	await database.connect()

	return {
		db: database,
		scheme: 'mongodb://',
		connectionStringWithRandomBadDatabaseName:
			'mongodb://localhost:27017/undefined',
		badDatabaseName: 'undefined',
	}
}

export default mongoConnect
