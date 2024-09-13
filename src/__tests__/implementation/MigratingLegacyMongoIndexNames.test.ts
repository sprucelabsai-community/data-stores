import { test, generateId } from '@sprucelabs/test-utils'
import {
    Collection,
    CreateIndexesOptions,
    Document,
    IndexSpecification,
    MongoClient,
} from 'mongodb'
import MongoDatabase, { MONGO_TEST_URI } from '../../databases/MongoDatabase'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import mongoConnect from '../support/mongoConnect'

export default class MigratingLegacyMongoIndexNamesTest extends AbstractDatabaseTest {
    private static collectionName: string
    private static adapter: MongoDatabase
    private static collection: Collection<Document>
    private static mongo: MongoClient

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()

        const dbName = 'migrating_legacy_index_names'
        this.collectionName = generateId()

        const { db: adapter } = await mongoConnect(MONGO_TEST_URI, dbName)
        this.adapter = adapter as MongoDatabase

        this.mongo = new MongoClient(MONGO_TEST_URI, {})
        const dabatase = this.mongo.db(dbName)
        const collection = dabatase.collection(this.collectionName)

        this.collection = collection
    }

    protected static async afterEach() {
        await super.afterEach()
        await this.mongo.close()
        await this.adapter.dropDatabase()
        await this.adapter.close()
    }

    @test('can sync indexes when already has name_1', 'name_1')
    @test(
        'can sync indexes when already has name_1_filtered',
        'name_1_filtered'
    )
    protected static async canSyncWithLegacyIndexNamesWhichHaveUnderscores(
        name: string
    ) {
        await this.createIndexRaw({ name: 1 }, { name })
        await this.adapter.syncIndexes(this.collectionName, [
            ['name', 'butter'],
        ])
    }

    @test()
    protected static async syncUniqueIndexesHonorsExistingName() {
        await this.createIndexRaw(
            { firstName: 1 },
            { name: 'firstName_1_bananas', unique: true }
        )

        await this.adapter.syncUniqueIndexes(this.collectionName, [
            ['firstName'],
        ])
    }

    private static async createIndexRaw(
        spec: IndexSpecification,
        options: CreateIndexesOptions
    ) {
        await this.collection.createIndex(spec, options)
    }
}
