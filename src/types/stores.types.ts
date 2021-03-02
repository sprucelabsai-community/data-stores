import StoreFactory from '../factories/StoreFactory'
import { Database } from './database.types'

export interface StoreOptions {
	db: Database
	storeFactory: StoreFactory
}

export interface Store {
	initialize?(): Promise<void>
}

export interface StoreMap {}
export interface StoreOptionsMap {}
