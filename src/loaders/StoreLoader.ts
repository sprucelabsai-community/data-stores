import pathUtil from 'path'
import AbstractSpruceError from '@sprucelabs/error'
import { diskUtil, namesUtil } from '@sprucelabs/spruce-skill-utils'
import globby from 'globby'
import { FailedToLoadStoreErrorOptions } from '#spruce/errors/options.types'
import SpruceError from '../errors/SpruceError'
import StoreFactory from '../factories/StoreFactory'
import { Database } from '../types/database.types'

type StoreLoadError = AbstractSpruceError<FailedToLoadStoreErrorOptions>

export default class StoreLoader {
	private activeDir: string
	private db: Database
	private static instance: Record<string, Promise<StoreLoader>> = {}
	private static defaultStoreDir: string
	private static defaultDb: Database

	private constructor(activeDir: string, db: Database) {
		this.activeDir = activeDir
		this.db = db
	}

	public static setCwd(dir: string) {
		this.defaultStoreDir = dir
	}

	public static setDb(db: Database) {
		this.defaultDb = db
	}

	public static async Loader(activeDir: string, db: Database) {
		return new this(activeDir, db)
	}

	public static async getInstance(cwd?: string, db?: Database) {
		const dir = cwd ?? this.defaultStoreDir

		if (!this.instance[dir]) {
			this.instance[dir] = this.Loader(dir, db ?? this.defaultDb)
		}
		return this.instance[dir]
	}

	public async loadStores() {
		const { factory, errors } = await this.loadStoresAndErrors()

		if (errors.length > 0) {
			throw new SpruceError({ code: 'FAILED_TO_LOAD_STORES', errors })
		}

		return factory
	}

	public async loadStoresAndErrors() {
		const { stores, errors } = await this.loadStoreClassesWithErrors()
		const factory = StoreFactory.Factory(this.db)

		for (const store of stores) {
			factory.setStore(namesUtil.toCamel(store.namePascal), store.Class)
		}

		return { factory, errors }
	}

	private async loadStoreClassesWithErrors(): Promise<{
		stores: { namePascal: string; Class: any }[]
		errors: StoreLoadError[]
	}> {
		const pattern = diskUtil.resolvePath(this.activeDir, '**', '*.store.[j|t]s')

		const matches = await globby(pattern)
		const errors: StoreLoadError[] = []

		const Stores: any[] = []

		for (const match of matches) {
			const namePascal =
				match.split(pathUtil.sep).pop()?.split('.store').shift() ?? 'MISSING'

			try {
				const Class = require(match).default
				Stores.push({ namePascal, Class })
			} catch (err) {
				const spruceError = new SpruceError({
					code: 'FAILED_TO_LOAD_STORE',
					originalError: err,
					name: namePascal,
				})

				//@ts-ignore
				errors.push(spruceError)
			}
		}

		return { stores: Stores, errors }
	}
}
