import SpruceError from '../errors/SpruceError'
import { Database } from '../types/database.types'
import { Store, StoreMap, StoreOptionsMap } from '../types/stores.types'

interface StoreContructor {
	Store(o: any): Store
}

type StoreName = keyof StoreMap
type StoreOptions<Name extends StoreName> = Name extends keyof StoreOptionsMap
	? StoreOptionsMap[Name]
	: Record<string, never>

export default class StoreFactory {
	private storeMap: Record<string, StoreContructor> = {}
	private db: Database

	private constructor(db: Database) {
		this.db = db
	}

	public static Factory(db: Database) {
		return new this(db)
	}

	public async Store<
		Name extends StoreName,
		Options extends StoreOptions<Name>
	>(name: Name, options?: Options): Promise<StoreMap[Name]> {
		const Store = this.storeMap[name]
		if (Store) {
			if (!Store.Store) {
				throw new SpruceError({
					code: 'INVALID_STORE',
					friendlyMessage:
						'You have to have a Store(options: StoreOptions) factory method on your store that returns `new this(options)`.',
				})
			}
			const instance = Store.Store({
				db: this.db,
				storeFactory: this,
				...options,
			})

			return instance as any
		}

		throw new SpruceError({
			code: 'INVALID_STORE_NAME',
			suppliedName: name,
			validNames: Object.keys(this.storeMap),
		})
	}

	public setStore(name: string, TestStore: StoreContructor) {
		this.storeMap[name] = TestStore
	}
}
