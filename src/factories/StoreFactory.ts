import { namesUtil } from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'
import { Database } from '../types/database.types'
import {
    DataStore,
    StoreMap,
    StoreName,
    StoreOptions,
} from '../types/stores.types'

export default class StoreFactory {
    public static Class?: new (db: Database) => StoreFactory

    private static initializations: Record<string, boolean> = {}

    protected storeMap: Record<string, StoreContructor> = {}
    protected databasesByStoreName: Record<string, Database> = {}

    private db: Database
    private stores: Partial<Record<StoreName, any>> = {}

    protected constructor(db: Database) {
        this.db = db
    }

    public static Factory(db: Database) {
        return new (this.Class ?? this)(db)
    }

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

            const db = this.databasesByStoreName[name] || this.db

            const instance = await Store.Store({
                db,
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

    public setStore(name: StoreName, store: DataStore | null) {
        this.stores[name] = store
    }

    public async getStore<Name extends StoreName>(
        name: Name
    ): Promise<StoreMap[Name]> {
        if (!this.stores[name]) {
            this.stores[name] = await this.Store(name)
        }
        return this.stores[name] as StoreMap[Name]
    }

    public static reset() {
        this.initializations = {}
    }

    public setDatabaseForStore<Name extends StoreName>(
        name: Name,
        db: Database
    ) {
        this.databasesByStoreName[name] = db
        delete this.stores[name]
    }
}

interface StoreContructor {
    Store(o: any): Promise<DataStore> | DataStore
}
