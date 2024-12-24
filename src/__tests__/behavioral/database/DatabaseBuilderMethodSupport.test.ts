import { test, assert, generateId } from '@sprucelabs/test-utils'
import DatabaseFactory from '../../../factories/DatabaseFactory'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import {
    CreateOptions,
    Database,
    DatabaseInternalOptions,
    Index,
    IndexWithFilter,
} from '../../../types/database.types'
import { QueryOptions } from '../../../types/query.types'

export default class DatabaseBuilderMethodSupportTest extends AbstractDatabaseTest {
    @test()
    protected static async canCreateUsingBuildMethod() {
        const scheme = 'test://'
        DatabaseFactory.addAdapter(scheme, WithBuilder)
        const connectionString = scheme + generateId()
        const dbName = generateId()
        const db = DatabaseFactory.Database({
            dbConnectionString: connectionString,
            dbName,
        })

        assert.isEqualDeep(db.constructorOptions, [
            connectionString,
            { dbName },
            'builder',
        ])
    }
}

class WithBuilder implements Database {
    public constructorOptions: any[]
    public constructor(...options: any[]) {
        this.constructorOptions = options
    }

    public static Database(...options: any[]) {
        return new this(...[...options, 'builder'])
    }

    public async syncUniqueIndexes(
        _collectionName: string,
        _indexes: Index[]
    ): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async syncIndexes(
        _collectionName: string,
        _indexes: Index[]
    ): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async dropIndex(
        _collectionName: string,
        _index: Index
    ): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async getUniqueIndexes(
        _collectionName: string
    ): Promise<IndexWithFilter[]> {
        throw new Error('Method not implemented.')
    }
    public async getIndexes(
        _collectionName: string
    ): Promise<IndexWithFilter[]> {
        throw new Error('Method not implemented.')
    }
    public isConnected(): boolean {
        throw new Error('Method not implemented.')
    }
    public generateId(): string {
        throw new Error('Method not implemented.')
    }
    public async connect(): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async close(): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public getShouldAutoGenerateId?(): boolean {
        throw new Error('Method not implemented.')
    }
    public async createOne(
        _collection: string,
        _values: Record<string, any>,
        _options?: CreateOptions
    ): Promise<Record<string, any>> {
        throw new Error('Method not implemented.')
    }
    public async create(
        _collection: string,
        _values: Record<string, any>[]
    ): Promise<Record<string, any>[]> {
        throw new Error('Method not implemented.')
    }
    public async dropCollection(_name: string): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async dropDatabase(): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async findOne(
        _collection: string,
        _query?: Record<string, any>,
        _options?: QueryOptions,
        _dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any> | null> {
        throw new Error('Method not implemented.')
    }
    public async find(
        _collection: string,
        _query?: Record<string, any>,
        _options?: QueryOptions,
        _dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any>[]> {
        throw new Error('Method not implemented.')
    }
    public async updateOne(
        _collection: string,
        _query: Record<string, any>,
        _updates: Record<string, any>,
        _dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any>> {
        throw new Error('Method not implemented.')
    }
    public async update(
        _collection: string,
        _query: Record<string, any>,
        _updates: Record<string, any>
    ): Promise<number> {
        throw new Error('Method not implemented.')
    }
    public async upsertOne(
        _collection: string,
        _query: Record<string, any>,
        _updates: Record<string, any>
    ): Promise<Record<string, any>> {
        throw new Error('Method not implemented.')
    }
    public async delete(
        _collection: string,
        _query: Record<string, any>
    ): Promise<number> {
        throw new Error('Method not implemented.')
    }
    public async deleteOne(
        _collection: string,
        _query: Record<string, any>
    ): Promise<number> {
        throw new Error('Method not implemented.')
    }
    public async count(
        _collection: string,
        _query?: Record<string, any>
    ): Promise<number> {
        throw new Error('Method not implemented.')
    }
    public async createUniqueIndex(
        _collection: string,
        _index: Index
    ): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async createIndex(
        _collection: string,
        _index: Index
    ): Promise<void> {
        throw new Error('Method not implemented.')
    }
    public async query<T>(_query: string, _params?: any[]): Promise<T[]> {
        throw new Error('Method not implemented.')
    }
}
