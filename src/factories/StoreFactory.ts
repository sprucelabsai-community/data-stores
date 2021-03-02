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
	>(name: Name, options?: Options): Promise<any> {
		const Store = this.storeMap[name]
		if (Store) {
			if (!Store.Store) {
				throw new SpruceError({
					code: 'INVALID_STORE',
					friendlyMessage:
						'You have to have a Store() factory method on your store that returns `new this()`.',
				})
			}
			const instance = Store.Store({
				db: this.db,
				storeFactory: this,
				...options,
			})
			return instance
		}

		throw new SpruceError({
			code: 'INVALID_STORE_NAME',
			suppliedName: name,
			validNames: [],
		})
	}

	public setStore(name: string, TestStore: StoreContructor) {
		this.storeMap[name] = TestStore
	}
}
