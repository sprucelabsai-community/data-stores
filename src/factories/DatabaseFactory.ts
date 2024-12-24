import { SchemaError } from '@sprucelabs/schema'
import MongoDatabase from '../databases/MongoDatabase'
import NeDbDatabase from '../databases/NeDbDatabase'
import SpruceError from '../errors/SpruceError'
import { Database, DatabaseOptions } from '../types/database.types'

export default class DatabaseFactory {
    private static cache: Record<string, any> = {}
    private static Adapters: AdapterMap = {
        'mongodb://': MongoDatabase,
        'mongodb+srv://': MongoDatabase,
        'memory://': NeDbDatabase,
    }

    private constructor() {}

    public static addAdapter(scheme: string, Adapter: DatabaseConstructor) {
        this.Adapters[scheme] = Adapter
    }

    public static Database(options: DatabaseFactoryOptions): Database {
        const { dbName, dbConnectionString } = options
        let database

        if (!dbConnectionString) {
            throw new SchemaError({
                code: 'MISSING_PARAMETERS',
                parameters: ['dbConnectionString'],
                friendlyMessage:
                    "DatabaseFactory can't connect to the database! Setting env.DB_CONNECTION_STRING may help!",
            })
        }

        const cacheKey = this.generateCacheKey(options)

        if (!this.cache[cacheKey]) {
            for (const [key, Adapter] of Object.entries(this.Adapters)) {
                if (dbConnectionString.startsWith(key)) {
                    const args: [string, DatabaseOptions] = [
                        dbConnectionString,
                        { dbName },
                    ]
                    database =
                        'Database' in Adapter
                            ? Adapter.Database(...args)
                            : new Adapter(...args)
                }
            }

            if (!database) {
                throw new SpruceError({
                    code: 'INVALID_CONNECTION_STRING_SCHEME',
                    connectionString: dbConnectionString,
                })
            }

            this.cache[cacheKey] = database
        }

        return this.cache[cacheKey]
    }

    private static generateCacheKey(options: {
        dbName?: string
        dbConnectionString: string
    }) {
        if (!options.dbName && options.dbConnectionString.includes('memory')) {
            const key = Object.keys(this.cache).find((k) =>
                k.startsWith('memory')
            )
            if (key) {
                return key
            }
        }
        return options.dbName + options.dbConnectionString
    }

    public static reset() {
        this.cache = {}
    }
}

export type DatabaseAdapterClass = new (
    connectionString: string,
    options: DatabaseOptions
) => Database

export interface DatabaseAdapterBuilder {
    Database(connectionString: string, options: DatabaseOptions): Database
}

export type DatabaseConstructor = DatabaseAdapterClass | DatabaseAdapterBuilder
type AdapterMap = Record<string, DatabaseConstructor>

interface DatabaseFactoryOptions {
    dbName?: string
    dbConnectionString: string
}
