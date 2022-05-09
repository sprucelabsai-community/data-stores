import { buildSchema, SchemaValues } from '@sprucelabs/schema'
import StoreFactory from '../../../../factories/StoreFactory'
import AbstractStore from '../../../../stores/AbstractStore'
import { Database } from '../../../../types/database.types'
import { UniversalStoreOptions } from '../../../../types/stores.types'

declare module '../../../../types/stores.types' {
	interface StoreMap {
		spy: SpyStore
	}

	interface StoreOptionsMap {
		spy: { testOption: boolean }
	}
}

const spySchema = buildSchema({
	id: 'test',
	fields: {
		id: {
			type: 'id',
		},
		firstName: {
			type: 'text',
			label: 'First Name',
		},
		lastName: {
			type: 'text',
			label: 'Last Name',
		},
	},
})

type SpyRecordSchema = typeof spySchema
export type SpyRecord = SchemaValues<SpyRecordSchema>
export default class SpyStore extends AbstractStore<SpyRecordSchema> {
	public db!: Database
	public storeFactory!: StoreFactory
	public name = 'test'
	public options: any

	public findArgs: any[] = []

	protected collectionName = 'test'
	protected createSchema = spySchema
	protected updateSchema = spySchema
	protected fullSchema = spySchema
	protected databaseSchema = spySchema
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
		SpyStore.initializeCount++
	}

	//@ts-ignore
	public async find(...args: any[]) {
		this.findArgs.push(args)
		//@ts-ignore
		return super.find(...args)
	}
}
