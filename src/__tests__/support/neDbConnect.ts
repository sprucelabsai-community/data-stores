import NeDbDatabase from '../../databases/NeDbDatabase'

export default async function neDbConnect() {
	const database = new NeDbDatabase()
	await database.connect()
	return { db: database, scheme: 'memory://' }
}
