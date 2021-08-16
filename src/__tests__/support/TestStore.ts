import { buildSchema } from '@sprucelabs/schema'
import StoreFactory from '../../factories/StoreFactory'
import AbstractStore from '../../stores/AbstractStore'
import { Database } from '../../types/database.types'
import { UniversalStoreOptions } from '../../types/stores.types'

const testSchema = buildSchema({
	id: 'test',
	fields: {
		firstName: {
			type: 'text',
			label: 'First Name',
		},
	},
})

type TestSchema = typeof testSchema
export default class TestStore extends AbstractStore<TestSchema> {
	public db!: Database
	public storeFactory!: StoreFactory
	public name = 'test'
	public options: any
	protected collectionName = 'test'
	protected createSchema = testSchema
	protected updateSchema = testSchema
	protected fullSchema = testSchema
	protected databaseSchema = testSchema
	public wasInitializedInvoked = false
	public static initializeCount = 0

	public static async Store(options: UniversalStoreOptions) {
		const store = new this(options.db)
		store.db = options.db
		store.storeFactory = options.storeFactory
		store.options = options
		return store
	}

	public async initialize() {
		this.wasInitializedInvoked = true
		TestStore.initializeCount++
	}
}
