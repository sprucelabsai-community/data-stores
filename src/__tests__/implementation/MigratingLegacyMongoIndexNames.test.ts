import { test, suite, generateId } from '@sprucelabs/test-utils'
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

@suite()
export default class MigratingLegacyMongoIndexNamesTest extends AbstractDatabaseTest {
    private collectionName!: string
    private adapter!: MongoDatabase
    private collection!: Collection<Document>
    private mongo!: MongoClient

    protected async beforeEach(): Promise<void> {
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

    protected async afterEach() {
        await super.afterEach()
        await this.mongo.close()
        await this.adapter.dropDatabase()
        await this.adapter.close()
    }

    @test(
        'can sync indexes when name exists and is different than normalize: name_1',
        'name_1'
    )
    @test(
        'can sync indexes when name exists and is different than normalize: name_1_filtered',
        'name_1_filtered'
    )
    protected async canSyncWithLegacyIndexNamesWhichHaveUnderscores(
        name: string
    ) {
        await this.createIndexRaw({ name: 1 }, { name })
        const index = ['name', 'butter']
        await this.syncIndexes(index)
    }

    @test()
    protected async syncUniqueIndexesHonorsExistingName() {
        await this.createIndexRaw(
            { firstName: 1 },
            { name: 'firstName_1_bananas', unique: true }
        )

        await this.adapter.syncUniqueIndexes(this.collectionName, [
            ['firstName'],
        ])
    }

    @test()
    protected async syncingWithSameFieldsButDifferentNamesDoesNotThrow() {
        await this.createIndexRaw({ name: 1 }, { name: 'name_1' })
        await this.syncIndexes(['name'])
    }

    private async syncIndexes(index: string[]) {
        await this.adapter.syncIndexes(this.collectionName, [index])
    }

    private async createIndexRaw(
        spec: IndexSpecification,
        options: CreateIndexesOptions
    ) {
        return await this.collection.createIndex(spec, options)
    }
}
