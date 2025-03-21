import { assert, errorAssert, generateId, test } from '@sprucelabs/test-utils'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import databaseAssertUtil from '../../../tests/databaseAssertUtil'
import { TestConnect } from '../../../types/database.types'
import mongoConnect from '../../support/mongoConnect'
import neDbConnect from '../../support/neDbConnect'

export default class MongoDatabaseTest extends AbstractDatabaseTest {
    @test('throws error when updating record not found (mongo)', mongoConnect)
    @test('throws error when updating record not found (neDb)', neDbConnect)
    protected static async throwsErrorWhenUpdatingRecordNotFound(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertThrowsWhenUpdatingRecordNotFound(connect)
    }

    @test('inserting generates id (mongo)', mongoConnect)
    @test('inserting generates id (neDb)', neDbConnect)
    protected static async insertingGeneratesId(connect: TestConnect) {
        await databaseAssertUtil.assertGeneratesIdDifferentEachTime(connect)
        await databaseAssertUtil.assertInsertingGeneratesId(connect)
    }

    @test('can sort asc on finds (mongo)', mongoConnect)
    @test('can sort asc on finds (neDb)', neDbConnect)
    protected static async canSortAscResults(connect: TestConnect) {
        await databaseAssertUtil.assertCanSortAsc(connect)
    }

    @test('can sort desc (mongo)', mongoConnect)
    @test('can sort desc (neDb)', neDbConnect)
    protected static async canSortDescResults(connect: TestConnect) {
        await databaseAssertUtil.assertCanSortDesc(connect)
    }

    @test('sort by id (mongo)', mongoConnect)
    @test('sort by id (neDb)', neDbConnect)
    protected static async canSortById(connect: TestConnect) {
        await databaseAssertUtil.assertCanSortById(connect)
    }

    @test('can update record (mongo)', mongoConnect)
    @test('can update record (neDb)', neDbConnect)
    protected static async canUpdate(connect: TestConnect) {
        await databaseAssertUtil.assertCanUpdate(connect)
    }

    @test('can find with $or', mongoConnect)
    protected static async canQueryWithOr(connect: TestConnect) {
        await databaseAssertUtil.assertCanQueryWithOr(connect)
    }

    @test('update many (mongo)', mongoConnect)
    @test('update many (neDb)', neDbConnect)
    protected static async updateMany(connect: TestConnect) {
        await databaseAssertUtil.assertCanUpdateMany(connect)
    }

    @test('can create many (mongo)', mongoConnect)
    @test('can create many (neDb)', neDbConnect)
    protected static async canCreateMany(connect: TestConnect) {
        await databaseAssertUtil.assertCanCreateMany(connect)
    }

    @test('can create with object field (mongo)', mongoConnect)
    @test('can create with object field (neDb)', neDbConnect)
    protected static async canCreateNestedObject(connect: TestConnect) {
        await databaseAssertUtil.assertCanCreateWithObjectField(connect)
    }

    @test('can update with object field (mongo)', mongoConnect)
    @test('can update with object field (neDb)', neDbConnect)
    protected static async canUpdateNestedObject(connect: TestConnect) {
        await databaseAssertUtil.assertCanUpdateWithObjectField(connect)
    }

    @test('can target update with object field (mongo)', mongoConnect)
    @test('can target update with object field (neDb)', neDbConnect)
    protected static async canTargetUpdateNestedObject(connect: TestConnect) {
        await databaseAssertUtil.assertCanUpdateFieldInObjectFieldWithTargettedWhere(
            connect
        )
    }

    @test('can push onto array (mongo)', mongoConnect)
    @test('can push onto array (neDb)', neDbConnect)
    protected static async canPush(connect: TestConnect) {
        await databaseAssertUtil.assertCanPushOntoArrayValue(connect)
    }

    @test('find with invalid id returns empty results (mongo)', mongoConnect)
    @test('find with invalid id returns empty results  (neDb)', neDbConnect)
    protected static async getEmptyResultFind(connect: TestConnect) {
        await databaseAssertUtil.assertEmptyDatabaseReturnsEmptyArray(connect)
    }

    @test('findOne with invalid id returns empty results (mongo)', mongoConnect)
    @test('findOne with invalid id returns empty results  (neDb)', neDbConnect)
    protected static async getEmptyResultsFindOne(connect: TestConnect) {
        await databaseAssertUtil.assertFindOneOnEmptyDatabaseReturnsNull(
            connect
        )
    }

    @test('can limit results (mongo)', mongoConnect)
    @test('can limit results (neDb)', neDbConnect)
    protected static async canLimitResults(connect: TestConnect) {
        await databaseAssertUtil.assertCanLimitResults(connect)
    }

    @test('can limit to zero results (mongo)', mongoConnect)
    @test('can limit to zero results (neDb)', neDbConnect)
    protected static async canLimitToZeroResults(connect: TestConnect) {
        await databaseAssertUtil.assertCanLimitResultsToZero(connect)
    }

    @test('can delete record (mongo)', mongoConnect)
    @test('can delete record (neDb)', neDbConnect)
    protected static async canDeleteRecord(connect: TestConnect) {
        await databaseAssertUtil.assertCanDeleteRecord(connect)
    }

    @test('can delete one (mongo)', mongoConnect)
    @test('can delete one (neDb)', neDbConnect)
    protected static async canDeleteOne(connect: TestConnect) {
        await databaseAssertUtil.assertCanDeleteOne(connect)
    }

    @test('can upsert (mongo)', mongoConnect)
    @test('can upsert (neDb)', neDbConnect)
    protected static async canUpsert(connect: TestConnect) {
        await databaseAssertUtil.assertCanUpsertOne(connect)
    }

    @test('has no unique indexes to start (mongo)', mongoConnect)
    @test('has no unique indexes to start (neDb)', neDbConnect)
    protected static async hasNoUniqueIndexToStart(connect: TestConnect) {
        await databaseAssertUtil.assertHasNoUniqueIndexToStart(connect)
    }

    @test('can create multiple unique indexes (mongo)', mongoConnect)
    @test('can create multiple unique indexes (neDb)', neDbConnect)
    protected static async canCreateUniqueIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanCreateUniqueIndex(connect)
    }

    @test('can create a compound field unique index (mongo)', mongoConnect)
    @test('can create a compound field unique index (neDb)', neDbConnect)
    protected static async canCreateMultiFieldUniqueIndex(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCanCreateMultiFieldUniqueIndex(connect)
    }

    @test("can't create the same unique indexes twice (mongo)", mongoConnect)
    @test("can't create the same unique indexes twice (neDb)", neDbConnect)
    protected static async cantCreateSameUniqueIndexTwice(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCantCreateUniqueIndexTwice(connect)
    }

    @test('can drop a unique index (mongo)', mongoConnect)
    @test('can drop a unique index (neDb)', neDbConnect)
    protected static async canDropUniqueIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanDropUniqueIndex(connect)
    }

    @test('can drop compound unique index (mongo)', mongoConnect)
    @test('can drop compound unique index (neDb)', neDbConnect)
    protected static async canDropCompoundUniqueIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanDropCompoundUniqueIndex(connect)
    }

    @test("can't drop unique index that doesn't exist (mongo)", mongoConnect)
    @test("can't drop unique index that doesn't exist (neDb)", neDbConnect)
    protected static async cantDropUniqueIndexThatDoesntExist(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCantDropUniqueIndexThatDoesntExist(
            connect
        )
    }

    @test("can't drop index when no indexes exist (mongo)", mongoConnect)
    @test("can't drop index when no indexes exist (neDb)", neDbConnect)
    protected static async cantDropIndexWhenNoIndexExist(connect: TestConnect) {
        await databaseAssertUtil.assertCantDropIndexWhenNoIndexExists(connect)
    }

    @test(
        "can't drop compound unique index that doesn't exist (mongo)",
        mongoConnect
    )
    @test(
        "can't drop compound unique index that doesn't exist (neDb)",
        neDbConnect
    )
    protected static async cantDropCompoundUniqueIndexThatDoesntExist(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCantDropCompoundUniqueIndexThatDoesntExist(
            connect
        )
    }

    @test('syncUniqueIndexes adds missing indexes (mongo)', mongoConnect)
    @test('syncUniqueIndexes adds missing indexes (neDb)', neDbConnect)
    protected static async syncUniqueIndexesAddsMissingIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncingUniqueIndexesAddsMissingIndexes(
            connect
        )
    }

    @test('syncUniqueIndexes skips existing indexes (mongo)', mongoConnect)
    @test('syncUniqueIndexes skips existing indexes (neDb)', neDbConnect)
    protected static async syncUniqueIndexesSkipsExistingIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncingUniqueIndexesSkipsExistingIndexes(
            connect
        )
    }

    @test('syncUniqueIndexes removes extra indexes (mongo)', mongoConnect)
    @test('syncUniqueIndexes removes extra indexes (neDb)', neDbConnect)
    protected static async syncUniqueIndexesRemovesExtraIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncingUniqueIndexesRemovesExtraIndexes(
            connect
        )
    }

    @test(
        'syncUniqueIndexes with different keys handles race conditions (mongo)',
        mongoConnect
    )
    @test(
        'syncUniqueIndexes with different keys handles race conditions (neDb)',
        neDbConnect
    )
    protected static async syncUniqueIndexesMultipleUpdates(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncingUniqueIndexesIsRaceProof(connect)
    }

    @test(
        'syncUniqueIndexes does not remove and add existing indexes (mongo)',
        mongoConnect
    )
    @test(
        'syncUniqueIndexes does not remove and add existing indexes (neDb)',
        neDbConnect
    )
    protected static async syncUniqueIndexesDoesNotRemoveAndAddExistingIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncingIndexesDoesNotAddAndRemove(
            connect
        )
    }

    @test(
        'can create a unique index that blocks duplicates (mongo)',
        mongoConnect
    )
    @test(
        'can create a unique index that blocks duplicates (neDb)',
        neDbConnect
    )
    protected static async canCreateUniqueIndexBlocksDuplicates(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertUniqueIndexBlocksDuplicates(connect)
    }

    @test('duplicate Keys On Insert Throws SpruceError (mongo)', mongoConnect)
    @test('duplicate Keys On Insert Throws SpruceError (neDb)', neDbConnect)
    protected static async duplicateKeysOnInsertThrowsSpruceError(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertDuplicateKeyThrowsOnInsert(connect)
    }

    @test(
        'syncing Unique Index On Duped Fields Throws SpruceError (mongo)',
        mongoConnect
    )
    @test(
        'syncing Unique Index On Duped Fields Throws SpruceError (neDb)',
        neDbConnect
    )
    protected static async settingUniqueIndexOnDupedFieldsThrowsSpruceError(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSettingUniqueIndexViolationThrowsSpruceError(
            connect
        )
    }

    @test('can create unique index based on nested field (mongo)', mongoConnect)
    @test('can create unique index based on nested field (neBd)', neDbConnect)
    protected static async nestedFieldIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanCreateUniqueIndexOnNestedField(
            connect
        )
    }

    @test(
        'can upsert record updating only changed field with unique index (mongo)',
        mongoConnect
    )
    @test(
        'can upsert record updating only changed field with unique index (neDb)',
        neDbConnect
    )
    protected static async upsertWithUniqueIndex(connect: TestConnect) {
        await databaseAssertUtil.assertUpsertWithUniqueIndex(connect)
    }

    @test(
        'can update record with unique index based on nested field (mongo)',
        mongoConnect
    )
    @test(
        'can update record with unique index based on nested field (neBd)',
        neDbConnect
    )
    protected static async nestedFieldIndexUpdate(connect: TestConnect) {
        await databaseAssertUtil.assertNestedFieldIndexUpdates(connect)
    }

    @test('has no indexes to start (mongo)', mongoConnect)
    @test('has no indexes to start (neDb)', neDbConnect)
    protected static async hasNoIndexToStart(connect: TestConnect) {
        await databaseAssertUtil.assertHasNoIndexToStart(connect)
    }

    @test('can create multiple indexes (mongo)', mongoConnect)
    @test('can create multiple indexes (neDb)', neDbConnect)
    protected static async canCreateIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanCreateIndex(connect)
    }

    @test("can't create the same indexes twice (mongo)", mongoConnect)
    @test("can't create the same indexes twice (neDb)", neDbConnect)
    protected static async cantCreateSameIndexTwice(connect: TestConnect) {
        await databaseAssertUtil.assertCantCreateSameIndexTwice(connect)
    }

    @test('can create a compound field index (mongo)', mongoConnect)
    @test('can create a compound field index (neDb)', neDbConnect)
    protected static async canCreateMultiFieldIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanCreateMultiFieldIndex(connect)
    }

    @test('can drop an index (mongo)', mongoConnect)
    @test('can drop an index (neDb)', neDbConnect)
    protected static async canDropIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanDropIndex(connect)
    }

    @test('can drop a compound index (mongo)', mongoConnect)
    @test('can drop a compound index (neDb)', neDbConnect)
    protected static async canDropCompoundIndex(connect: TestConnect) {
        await databaseAssertUtil.assertCanDropCompoundIndex(connect)
    }

    @test("can't drop compound index that doesn't exist (mongo)", mongoConnect)
    @test("can't drop compound index that doesn't exist (neDb)", neDbConnect)
    protected static async cantDropCompoundIndexThatDoesntExist(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCantDropCompoundIndexThatDoesNotExist(
            connect
        )
    }

    @test('syncIndexes skips existing indexes (mongo)', mongoConnect)
    @test('syncIndexes skips existing indexes (neDb)', neDbConnect)
    protected static async syncIndexesSkipsExistingIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncIndexesSkipsExisting(connect)
    }

    @test('syncIndexes removes extra indexes (neDb)', neDbConnect)
    protected static async syncIndexesRemovesExtraIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncIndexesRemovesExtraIndexes(connect)
    }

    @test(
        'syncIndexes multiple times with different keys (mongo)',
        mongoConnect
    )
    @test('syncIndexes multiple times with different keys (neDb)', neDbConnect)
    protected static async syncIndexesMultipleUpdates(connect: TestConnect) {
        await databaseAssertUtil.assertSyncIndexesHandlesRaceConditions(connect)
    }

    @test(
        'syncIndexes does not remove and add existing indexes (mongo)',
        mongoConnect
    )
    @test(
        'syncIndexes does not remove and add existing indexes (neDb)',
        neDbConnect
    )
    protected static async syncIndexesDoesNotRemoveAndAddExistingIndexes(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertSyncIndexesDoesNotRemoveExisting(connect)
    }

    @test('can syncIndexes with partialFilterExpresson (mongo)', mongoConnect)
    @test('can syncIndexes with partialFilterExpresson (neDb)', neDbConnect)
    protected static async canSyncIndexesWithPartialFilterExpression(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCanSyncUniqueIndexesWithFilterExpression(
            connect
        )
    }

    @test(
        'can syncIndexes without partial then again with properly updates (mongo)',
        mongoConnect
    )
    protected static async canSyncIndexesWithoutPartialThenAgainWithProperlyUpdates(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertCanSyncIndexesWithoutPartialThenAgainWithProperlyUpdates(
            connect
        )
    }

    @test(
        'can save, get back, update, and search against null+undefined undefined -> null (mongo)',
        mongoConnect
    )
    @test(
        'can save, get back, update, and search against null+undefined undefined -> null (neDb)',
        neDbConnect
    )
    protected static async canSaveAndGetNullAndUndefined(connect: TestConnect) {
        await databaseAssertUtil.assertCanSaveAndGetNullAndUndefined(connect)
    }

    // nodejs mongo lib can't upsert when searching against null field (or maybe non id field???)
    @test.skip(
        'can upsert against null+undefined undefined -> null (mongo)',
        mongoConnect
    )
    @test(
        'can upsert against null+undefined undefined -> null (neDb)',
        neDbConnect
    )
    protected static async canUpsertNull(connect: TestConnect) {
        await databaseAssertUtil.assertCanUpsertNull(connect)
    }

    @test('can count (mongo)', mongoConnect)
    @test('can count (neDb)', neDbConnect)
    protected static async canCount(connect: TestConnect) {
        await databaseAssertUtil.assertCanCount(connect)
    }

    @test('can count on id (mongo)', mongoConnect)
    @test('can count on id (neDb)', neDbConnect)
    protected static async canCountOnId(connect: TestConnect) {
        await databaseAssertUtil.assertCanCountOnId(connect)
    }

    @test('can find by id with $in (mongo)', mongoConnect)
    @test('can find by id with $in (neDb)', neDbConnect)
    protected static async canFindWithIn(connect: TestConnect) {
        await databaseAssertUtil.assertCanFindWithIn(connect)
    }

    @test('can find by id with $ne (mongo)', mongoConnect)
    @test('can find by id with $ne (neDb)', neDbConnect)
    protected static async canFindWithNe(connect: TestConnect) {
        await databaseAssertUtil.assertCanFindWithNe(connect)
    }

    @test('can find by by boolean field (mongo)', mongoConnect)
    @test('can find by by boolean field (neDb)', neDbConnect)
    protected static async canFindByBooleanField(connect: TestConnect) {
        await databaseAssertUtil.assertCanFindWithBooleanField(connect)
    }

    @test(
        'provides helpful duplicate field error with multiple indexes, one at a time (mongo)',
        mongoConnect
    )
    @test(
        'provides helpful duplicate field error with multiple indexes, one at a time (neDb)',
        neDbConnect
    )
    protected static async duplicateFieldsOnMultipleUniqueIndexesHitOneAtATime(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertDuplicateFieldsWithMultipleUniqueIndexesWorkAsExpected(
            connect
        )
    }

    @test('can find by $gt, $lt, $gte, $lte (mongo)', mongoConnect)
    @test('can find by $gt, $lt, $gte, $lte (neDb)', neDbConnect)
    protected static async canQueryByGtLtGteLte(connect: TestConnect) {
        await databaseAssertUtil.assertCanQueryByGtLtGteLteNe(connect)
    }

    @test('can search by path to sub object (mongo)', mongoConnect)
    @test('can search by path to sub object (neDb)', neDbConnect)
    protected static async canQueryByPathToSubObject(connect: TestConnect) {
        await databaseAssertUtil.assertCanQueryPathWithDotSyntax(connect)
    }

    @test('knows if connected (mongo)', mongoConnect)
    @test('always connected (nedb)', neDbConnect)
    protected static async knowsIfConnected(connect: TestConnect) {
        await databaseAssertUtil.assertKnowsIfConnectionClosed(connect)
    }

    @test('throws invalid connection string (mongo)', mongoConnect)
    protected static async throwsInvalidConnectionString(connect: TestConnect) {
        await databaseAssertUtil.assertThrowsWithInvalidConnectionString(
            connect
        )
    }

    @test('throws unable to connect to db (mongo)', mongoConnect)
    protected static async throwsWhenCantConnectToDb(connect: TestConnect) {
        await databaseAssertUtil.assertThrowsWhenCantConnect(connect)
    }

    @test.skip(
        "can't give bad database name (mongo) - mongo creates databases on demand, so this cant throw.",
        mongoConnect
    )
    protected static async cantUndefinedADbName(connect: TestConnect) {
        await databaseAssertUtil.assertThrowsWithBadDatabaseName(connect)
    }

    @test('can choose which fields to return (mongo)', mongoConnect)
    @test('can choose which fields to return (neDb)', neDbConnect)
    protected static async selectFields(connect: TestConnect) {
        await databaseAssertUtil.assertCanReturnOnlySelectFields(connect)
    }

    @test('can search by regex (mongo)', mongoConnect)
    @test('can search by regex (neDb)', neDbConnect)
    protected static async canSearchByRegx(connect: TestConnect) {
        await databaseAssertUtil.assertCanSearchByRegex(connect)
    }

    @test('can $push to array (mongo)', mongoConnect)
    @test('can $push to array (neDb)', neDbConnect)
    protected static async can$pushOnUpsert(connect: TestConnect) {
        await databaseAssertUtil.assertCanPushToArrayOnUpsert(connect)
    }

    @test('throws when trying raw query (mongo)', mongoConnect)
    protected static async cantRunRawQuery(connect: TestConnect) {
        const { db } = await connect()
        const err = await assert.doesThrowAsync(() =>
            db.query('select * from test')
        )

        errorAssert.assertError(err, 'NOT_IMPLEMENTED')
    }

    @test()
    protected static async neDbCanSaveIdFieldAsNumber() {
        const { db } = await neDbConnect()
        const created = await db.createOne(generateId(), {
            id: 1,
            firstName: 'test',
        })

        assert.isEqual(created.id, 1)
    }

    @test('can update nested value (mongo)', mongoConnect)
    @test('can update nested value (neDb)', neDbConnect)
    protected static async canUpdateUsingNestedKey(connect: TestConnect) {
        await databaseAssertUtil.canUpdateNestedField(connect)
    }

    @test('can upsert nested value (mongo)', mongoConnect)
    @test('can upsert nested value (neDb)', neDbConnect)
    protected static async canUpsertUsingNestedKey(connect: TestConnect) {
        await databaseAssertUtil.canUpsertNestedField(connect)
    }

    @test('update returns proper matched and updated counts', mongoConnect)
    @test('update returns proper matched and updated counts', neDbConnect)
    protected static async updateReturnsMatchedAndUpdatedCounts(
        connect: TestConnect
    ) {
        await databaseAssertUtil.assertUpdateReturnsMatchedCounts(connect)
    }
}

export let dbCount = 0
