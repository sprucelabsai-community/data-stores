import { namesUtil } from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'
import { Database } from '../types/database.types'
import { Store, StoreMap, StoreName, StoreOptions } from '../types/stores.types'

interface StoreContructor {
	Store(o: any): Promise<Store> | Store
}

export default class StoreFactory {
	private storeMap: Record<string, StoreContructor> = {}
	private db: Database
	private static initializations: Record<string, boolean> = {}
	private stores: Partial<Record<StoreName, any>> = {}

	private constructor(db: Database) {
		this.db = db
	}

	public static Factory(db: Database) {
		return new this(db)
	}

	/**
	 * @deprecated stores.Store(..) -> stores.getStore(...)
	 * This change has big speed improvements. This factory method
	 * will never be removed, but hopefully won't be needed often.
	 */
	public async Store<
		Name extends StoreName,
		Options extends StoreOptions<Name>,
	>(name: Name, options?: Options): Promise<StoreMap[Name]> {
		const Store = this.storeMap[name]
		if (Store) {
			if (!Store.Store) {
				throw new SpruceError({
					code: 'INVALID_STORE',
					friendlyMessage: `You have to have ${namesUtil.toPascal(
						name
					)}.Store(options: UniversalStoreOptions) factory method on your store that returns \`new this(...)\`.`,
				})
			}
			const instance = await Store.Store({
				db: this.db,
				storeFactory: this,
				...options,
			})

			if (!StoreFactory.initializations[name]) {
				StoreFactory.initializations[name] = true
				await instance.initialize?.()
			}

			return instance as any
		}

		throw new SpruceError({
			code: 'INVALID_STORE_NAME',
			suppliedName: name,
			validNames: this.getStoreNames(),
		})
	}

	public getStoreNames(): StoreName[] {
		return Object.keys(this.storeMap) as any
	}

	public setStoreClass(name: string, Class: StoreContructor) {
		this.storeMap[name] = Class
	}

	public setStore(name: StoreName, store: Store | null) {
		this.stores[name] = store
	}

	public async getStore<Name extends StoreName>(
		name: Name
	): Promise<StoreMap[Name]> {
		if (!this.stores[name]) {
			this.stores[name] = await this.Store(name)
		}
		return this.stores[name]
	}

	public static reset() {
		this.initializations = {}
	}
}
