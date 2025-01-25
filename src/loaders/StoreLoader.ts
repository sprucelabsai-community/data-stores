import pathUtil from 'path'
import AbstractSpruceError from '@sprucelabs/error'
import globby from '@sprucelabs/globby'
import { SchemaError } from '@sprucelabs/schema'
import {
    diskUtil,
    HASH_SPRUCE_DIR_NAME,
    namesUtil,
} from '@sprucelabs/spruce-skill-utils'
import { FailedToLoadStoreErrorOptions } from '#spruce/errors/options.types'
import SpruceError from '../errors/SpruceError'
import StoreFactory from '../factories/StoreFactory'
import { Database } from '../types/database.types'
import { StoreName } from '../types/stores.types'

type StoreLoadError = AbstractSpruceError<FailedToLoadStoreErrorOptions>

interface Store {
    namePascal: string
    Class: any
}

export default class StoreLoader {
    private activeDir: string
    private db: Database
    private static instance: Record<string, Promise<StoreLoader>> = {}
    private static defaultStoreDir: string
    private static defaultDb: Database
    private factory?: StoreFactory

    private constructor(activeDir: string, db: Database) {
        this.activeDir = activeDir
        this.db = db
    }

    public static setStoreDir(dir: string) {
        this.defaultStoreDir = dir
    }

    public static setDatabase(db: Database) {
        this.defaultDb = db
    }

    public static async Loader(activeDir: string, db: Database) {
        return new this(activeDir, db)
    }

    public static async getInstance(cwd?: string, database?: Database) {
        const dir = cwd ?? this.defaultStoreDir
        const db = database ?? this.defaultDb

        const missing: string[] = []

        if (!dir) {
            missing.push('cwd')
        }

        if (!db) {
            missing.push('database')
        }

        if (missing.length > 0) {
            throw new SchemaError({
                code: 'MISSING_PARAMETERS',
                parameters: missing,
            })
        }

        const normalizedDir = dir.replace(/\/$/, '')

        if (!this.instance[normalizedDir]) {
            this.instance[normalizedDir] = this.Loader(normalizedDir, db)
        }
        return this.instance[normalizedDir]
    }

    public async loadStores() {
        const { factory, errors } = await this.loadStoresAndErrors()

        if (errors.length > 0) {
            throw new SpruceError({ code: 'FAILED_TO_LOAD_STORES', errors })
        }

        return factory
    }

    public async loadStoresAndErrors() {
        let errors: StoreLoadError[] = []
        if (!this.factory) {
            const { stores, errors: loadedErrors } =
                await this.loadStoreClassesWithErrors()

            errors = loadedErrors
            const factory = StoreFactory.Factory(this.db)

            for (const store of stores) {
                factory.setStoreClass(
                    namesUtil.toCamel(store.namePascal) as StoreName,
                    store.Class
                )
            }

            if (errors.length === 0) {
                this.factory = factory
            } else {
                return { factory, errors }
            }
        }
        return { factory: this.factory!, errors }
    }

    private async loadStoreClassesWithErrors(): Promise<{
        stores: Store[]
        errors: StoreLoadError[]
    }> {
        const combinedFile = diskUtil.resolveFile(
            this.activeDir,
            HASH_SPRUCE_DIR_NAME,
            'stores',
            'stores'
        )

        if (!combinedFile) {
            return { stores: [], errors: [] }
        }

        const errors: StoreLoadError[] = []
        const Stores: Store[] = []

        try {
            const map = require(combinedFile).default
            Object.keys(map).forEach((k) => {
                Stores.push({
                    Class: map[k],
                    namePascal: k,
                })
            })
        } catch {
            const pattern = diskUtil.resolvePath(
                this.activeDir,
                '**',
                '*.store.[j|t]s'
            )
            const matches = await globby(pattern)

            for (const match of matches) {
                const namePascal =
                    match.split(pathUtil.sep).pop()?.split('.store').shift() ??
                    'MISSING'

                try {
                    const Class = require(match).default
                    Stores.push({ namePascal, Class })
                } catch (err: any) {
                    const spruceError = new SpruceError({
                        code: 'FAILED_TO_LOAD_STORE',
                        originalError: err,
                        name: namePascal,
                    })

                    //@ts-ignore
                    errors.push(spruceError)
                }
            }
        }

        return { stores: Stores, errors }
    }

    public static clearInstance() {
        this.instance = {}
    }
}
