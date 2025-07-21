import { test, suite } from '@sprucelabs/test-utils'
import MongoDatabase, { MONGO_TEST_URI } from '../../databases/MongoDatabase'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'

@suite()
export default class HandlingMongoErrorsTest extends AbstractDatabaseTest {
    @test()
    protected async canCreateHandlingMongoErrors() {
        const database = new ThrowingMongDatabase(MONGO_TEST_URI, {
            dbName: 'testing-lost-connections',
        })

        await database.connect()

        database.throwOnTopology(new Error('Purposely throwing!'))

        await database.close()
    }
}

class ThrowingMongDatabase extends MongoDatabase {
    public throwOnTopology(err: Error) {
        //@ts-ignore
        this.mongo.topology.emit('error', err)
    }
}
