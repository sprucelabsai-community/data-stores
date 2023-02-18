import MongoDatabase, { MONGO_TEST_URI } from '../../databases/MongoDatabase'

let dbCount = 0

export default async function mongoConnect(
	dbConnectionString = MONGO_TEST_URI,
	dbName?: string
) {
	const name = dbName ?? `mercury_${new Date().getTime()}-${dbCount++}`
	const database = new MongoDatabase(dbConnectionString, { dbName: name })

	await database.connect()

	return database
}
