import { test } from '@sprucelabs/test-utils'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import databaseAssertUtil from '../../../tests/databaseAssertUtil'
import { Database } from '../../../types/database.types'
import mongoConnect from '../../support/mongoConnect'
import neDbConnect from '../../support/neDbConnect'

export default class MongoDatabaseTest extends AbstractDatabaseTest {
	@test('throws error when updating record not found (mongo)', mongoConnect)
	@test('throws error when updating record not found (neDb)', neDbConnect)
	protected static async throwsErrorWhenUpdatingRecordNotFound(
		connect: Connect
	) {
		await databaseAssertUtil.assertThrowsWhenUpdatingRecordNotFound(connect)
	}

	@test('inserting generates id (mongo)', mongoConnect)
	@test('inserting generates id (neDb)', neDbConnect)
	protected static async insertingGeneratesId(connect: Connect) {
		await databaseAssertUtil.assertInsertingGeneratesId(connect)
	}

	@test('can sort asc on finds (mongo)', mongoConnect)
	@test('can sort asc on finds (neDb)', neDbConnect)
	protected static async canSortAscResults(connect: Connect) {
		await databaseAssertUtil.assertCanSortAsc(connect)
	}

	@test('can sort desc (mongo)', mongoConnect)
	@test('can sort desc (neDb)', neDbConnect)
	protected static async canSortDescResults(connect: Connect) {
		await databaseAssertUtil.assertCanSortDesc(connect)
	}

	@test('sort by id (mongo)', mongoConnect)
	@test('sort by id (neDb)', neDbConnect)
	protected static async canSortById(connect: Connect) {
		await databaseAssertUtil.assertCanSortById(connect)
	}

	@test('can update record (mongo)', mongoConnect)
	@test('can update record (neDb)', neDbConnect)
	protected static async canUpdate(connect: Connect) {
		await databaseAssertUtil.assertCanUpdate(connect)
	}

	@test('can find with $or', mongoConnect)
	protected static async canQueryWithOr(connect: Connect) {
		await databaseAssertUtil.assertCanQueryWithOr(connect)
	}

	@test('update many (mongo)', mongoConnect)
	@test('update many (neDb)', neDbConnect)
	protected static async updateMany(connect: Connect) {
		await databaseAssertUtil.assertCanUpdateMany(connect)
	}

	@test('can create many (mongo)', mongoConnect)
	@test('can create many (neDb)', neDbConnect)
	protected static async canCreateMany(connect: Connect) {
		await databaseAssertUtil.assertCanCreateMany(connect)
	}

	@test('can push onto array (mongo)', mongoConnect)
	@test('can push onto array (neDb)', neDbConnect)
	protected static async canPush(connect: Connect) {
		await databaseAssertUtil.assertCanPushOntoArrayValue(connect)
	}

	@test('find with invalid id returns empty results (mongo)', mongoConnect)
	@test('find with invalid id returns empty results  (neDb)', neDbConnect)
	protected static async getEmptyResultFind(connect: Connect) {
		await databaseAssertUtil.assertEmptyDatabaseReturnsEmptyArray(connect)
	}

	@test('findOne with invalid id returns empty results (mongo)', mongoConnect)
	@test('findOne with invalid id returns empty results  (neDb)', neDbConnect)
	protected static async getEmptyResultsFindOne(connect: Connect) {
		await databaseAssertUtil.assertFindOneOnEmptyDatabaseReturnsNull(connect)
	}

	@test('can limit results (mongo)', mongoConnect)
	@test('can limit results (neDb)', neDbConnect)
	protected static async canLimitResults(connect: Connect) {
		await databaseAssertUtil.assertCanLimitResults(connect)
	}

	@test('can limit to zero results (mongo)', mongoConnect)
	@test('can limit to zero results (neDb)', neDbConnect)
	protected static async canLimitToZeroResults(connect: Connect) {
		await databaseAssertUtil.assertCanLimitResultsToZero(connect)
	}

	@test('can delete record (mongo)', mongoConnect)
	@test('can delete record (neDb)', neDbConnect)
	protected static async canDeleteRecord(connect: Connect) {
		await databaseAssertUtil.assertCanDeleteRecord(connect)
	}

	@test('can delete one (mongo)', mongoConnect)
	@test('can delete one (neDb)', neDbConnect)
	protected static async canDeleteOne(connect: Connect) {
		await databaseAssertUtil.assertCanDeleteOne(connect)
	}

	@test('can upsert (mongo)', mongoConnect)
	@test('can upsert (neDb)', neDbConnect)
	protected static async canUpsert(connect: Connect) {
		await databaseAssertUtil.assertCanShutdown(connect)
	}

	@test('has no unique indexes to start (mongo)', mongoConnect)
	@test('has no unique indexes to start (neDb)', neDbConnect)
	protected static async hasNoUniqueIndexToStart(connect: Connect) {
		await databaseAssertUtil.assertHasNoUniqueIndexToStart(connect)
	}

	@test('can create multiple unique indexes (mongo)', mongoConnect)
	@test('can create multiple unique indexes (neDb)', neDbConnect)
	protected static async canCreateUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateUniqueIndex(connect)
	}

	@test('can create a compound field unique index (mongo)', mongoConnect)
	@test('can create a compound field unique index (neDb)', neDbConnect)
	protected static async canCreateMultiFieldUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateMultiFieldUniqueIndex(connect)
	}

	@test("can't create the same unique indexes twice (mongo)", mongoConnect)
	@test("can't create the same unique indexes twice (neDb)", neDbConnect)
	protected static async cantCreateSameUniqueIndexTwice(connect: Connect) {
		await databaseAssertUtil.assertCantCreateUniqueIndexTwice(connect)
	}

	@test('can drop a unique index (mongo)', mongoConnect)
	@test('can drop a unique index (neDb)', neDbConnect)
	protected static async canDropUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropUniqueIndex(connect)
	}

	@test('can drop compound unique index (mongo)', mongoConnect)
	@test('can drop compound unique index (neDb)', neDbConnect)
	protected static async canDropCompoundUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropCompoundUniqueIndex(connect)
	}

	@test("can't drop unique index that doesn't exist (mongo)", mongoConnect)
	@test("can't drop unique index that doesn't exist (neDb)", neDbConnect)
	protected static async cantDropUniqueIndexThatDoesntExist(connect: Connect) {
		await databaseAssertUtil.assertCantDropUniqueIndexThatDoesntExist(connect)
	}

	@test("can't drop index when no indexes exist (mongo)", mongoConnect)
	@test("can't drop index when no indexes exist (neDb)", neDbConnect)
	protected static async cantDropIndexWhenNoIndexExist(connect: Connect) {
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
		connect: Connect
	) {
		await databaseAssertUtil.assertCantDropCompoundUniqueIndexThatDoesntExist(
			connect
		)
	}

	@test('syncUniqueIndexes adds missing indexes (mongo)', mongoConnect)
	@test('syncUniqueIndexes adds missing indexes (neDb)', neDbConnect)
	protected static async syncUniqueIndexesAddsMissingIndexes(connect: Connect) {
		await databaseAssertUtil.assertSyncingUniqueIndexsAddsMissingIndexes(
			connect
		)
	}

	@test('syncUniqueIndexes skips existing indexes (mongo)', mongoConnect)
	@test('syncUniqueIndexes skips existing indexes (neDb)', neDbConnect)
	protected static async syncUniqueIndexesSkipsExistingIndexes(
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncingUniqueIndexsSkipsExistingIndexs(
			connect
		)
	}

	@test('syncUniqueIndexes removes extra indexes (mongo)', mongoConnect)
	@test('syncUniqueIndexes removes extra indexes (neDb)', neDbConnect)
	protected static async syncUniqueIndexesRemovesExtraIndexes(
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncingUniqueIndexesRemovesExtraIndexes(
			connect
		)
	}

	@test(
		'syncUniqueIndexes multiple times with different keys (mongo)',
		mongoConnect
	)
	@test(
		'syncUniqueIndexes multiple times with different keys (neDb)',
		neDbConnect
	)
	protected static async syncUniqueIndexesMultipleUpdates(connect: Connect) {
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
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncingIndexesDoesNotAddAndRemove(connect)
	}

	@test(
		'can create a unique index that blocks duplicates (mongo)',
		mongoConnect
	)
	@test('can create a unique index that blocks duplicates (neDb)', neDbConnect)
	protected static async canCreateUniqueIndexBlocksDuplicates(
		connect: Connect
	) {
		await databaseAssertUtil.assertUniqueIndexBlocksDuplicates(connect)
	}

	@test('duplicate Keys On Insert Throws SpruceError (mongo)', mongoConnect)
	@test('duplicate Keys On Insert Throws SpruceError (neDb)', neDbConnect)
	protected static async duplicateKeysOnInsertThrowsSpruceError(
		connect: Connect
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
		connect: Connect
	) {
		await databaseAssertUtil.assertSettingUniqueIndexViolationThrowsSpruceError(
			connect
		)
	}

	@test('can create unique index based on nested field (mongo)', mongoConnect)
	@test('can create unique index based on nested field (neBd)', neDbConnect)
	protected static async nestedFieldIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateUniqueIndexOnNestedField(connect)
	}

	@test(
		'can upsert record updating only changed field with unique index (mongo)',
		mongoConnect
	)
	@test(
		'can upsert record updating only changed field with unique index (neDb)',
		neDbConnect
	)
	protected static async upsertWithUniqueIndex(connect: Connect) {
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
	protected static async nestedFieldIndexUpdate(connect: Connect) {
		await databaseAssertUtil.assertNestedFieldIndexUpdates(connect)
	}

	@test('has no indexes to start (mongo)', mongoConnect)
	@test('has no indexes to start (neDb)', neDbConnect)
	protected static async hasNoIndexToStart(connect: Connect) {
		await databaseAssertUtil.assertHasNoIndexToStart(connect)
	}

	@test('can create multiple indexes (mongo)', mongoConnect)
	@test('can create multiple indexes (neDb)', neDbConnect)
	protected static async canCreateIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateIndex(connect)
	}

	@test("can't create the same indexes twice (mongo)", mongoConnect)
	@test("can't create the same indexes twice (neDb)", neDbConnect)
	protected static async cantCreateSameIndexTwice(connect: Connect) {
		await databaseAssertUtil.assertCantCreateSameIndexTwice(connect)
	}

	@test('can create a compound field index 1 (mongo)', mongoConnect, [
		'field',
		'field2',
	])
	@test('can create a compound field index 1 (neDb)', neDbConnect, [
		'field',
		'field2',
	])
	@test('can create a compound field index 2 (mongo)', mongoConnect, [
		'otherField',
		'otherField2',
	])
	@test('can create a compound field index 2 (neDb)', neDbConnect, [
		'otherField',
		'otherField2',
	])
	protected static async canCreateMultiFieldIndex(
		connect: Connect,
		fields: any
	) {
		await databaseAssertUtil.assertCanCreateMultiFieldIndex(connect, fields)
	}

	@test('can drop a index (mongo)', mongoConnect)
	@test('can drop a index (neDb)', neDbConnect)
	protected static async canDropIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropIndex(connect)
	}

	@test('can drop a compound index (mongo)', mongoConnect)
	@test('can drop a compound index (neDb)', neDbConnect)
	protected static async canDropCompoundIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropCompoundIndex(connect)
	}

	@test("can't drop compound  index that doesn't exist (mongo)", mongoConnect)
	@test("can't drop compound  index that doesn't exist (neDb)", neDbConnect)
	protected static async cantDropCompoundIndexThatDoesntExist(
		connect: Connect
	) {
		await databaseAssertUtil.assertCantDropCompoundIndexThatDoesNotExist(
			connect
		)
	}

	@test('syncIndexes skips existing indexes (mongo)', mongoConnect)
	@test('syncIndexes skips existing indexes (neDb)', neDbConnect)
	protected static async syncIndexesSkipsExistingIndexes(connect: Connect) {
		await databaseAssertUtil.assertSyncIndexesSkipsExisting(connect)
	}

	@test('syncIndexes removes extra indexes (neDb)', neDbConnect)
	protected static async syncIndexesRemovesExtraIndexes(connect: Connect) {
		await databaseAssertUtil.assertSyncIndexesRemovesExtraIndexes(connect)
	}

	@test('syncIndexes multiple times with different keys (mongo)', mongoConnect)
	@test('syncIndexes multiple times with different keys (neDb)', neDbConnect)
	protected static async syncIndexesMultipleUpdates(connect: Connect) {
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
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncIndexesDoesNotRemoveExisting(connect)
	}

	@test(
		'can save, get back, update, and search against null+undefined undefined -> null (mongo)',
		mongoConnect
	)
	@test(
		'can save, get back, update, and search against null+undefined undefined -> null (neDb)',
		neDbConnect
	)
	protected static async canSaveAndGetNullAndUndefined(connect: Connect) {
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
	protected static async canUpsertNull(connect: Connect) {
		await databaseAssertUtil.assertCanUpsertNull(connect)
	}

	@test('can count (mongo)', mongoConnect)
	@test('can count (neDb)', neDbConnect)
	protected static async canCount(connect: Connect) {
		await databaseAssertUtil.assertCanCount(connect)
	}

	@test('can count on id (mongo)', mongoConnect)
	@test('can count on id (neDb)', neDbConnect)
	protected static async canCountOnId(connect: Connect) {
		await databaseAssertUtil.assertCanCountOnId(connect)
	}

	@test('can find by id with $in (mongo)', mongoConnect)
	@test('can find by id with $in (neDb)', neDbConnect)
	protected static async canFindWithIn(connect: Connect) {
		await databaseAssertUtil.assertCanFindWithIn(connect)
	}

	@test('can find by id with $ne (mongo)', mongoConnect)
	@test('can find by id with $ne (neDb)', neDbConnect)
	protected static async canFindWithNe(connect: Connect) {
		await databaseAssertUtil.assertCanFindWithNe(connect)
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
		connect: Connect
	) {
		await databaseAssertUtil.assertDuplicateFieldsWithMultipleUniqueIndexesWorkAsExpected(
			connect
		)
	}

	@test('can find by $gt, $lt, $gte, $lte (mongo)', mongoConnect)
	@test('can find by $gt, $lt, $gte, $lte (neDb)', neDbConnect)
	protected static async canQueryByGtLtGteLte(connect: Connect) {
		await databaseAssertUtil.assertCanQueryByGtLtGteLte(connect)
	}

	@test('can search by path to sub object (mongo)', mongoConnect)
	@test('can search by path to sub object (neDb)', neDbConnect)
	protected static async canQueryByPathToSubObject(connect: Connect) {
		await databaseAssertUtil.assertCanQueryPathWithDotSyntax(connect)
	}

	@test('knows if connected (mongo)', mongoConnect)
	@test('always connected (nedb)', neDbConnect)
	protected static async knowsIfConnected(connect: Connect) {
		await databaseAssertUtil.assertKnowsIfConnectionClosed(connect)
	}

	@test('throws invalid connection string (mongo)', mongoConnect)
	protected static async throwsInvalidConnectionString(connect: Connect) {
		await databaseAssertUtil.assertThrowsWithInvalidConnectionString(connect)
	}

	@test('throws unable to connect to db (mongo)', mongoConnect)
	protected static async throwsWhenCantConnectToDb(connect: Connect) {
		await databaseAssertUtil.assertThrowsWhenCantConnect(connect)
	}

	@test("can't name a database undefined (mongo)", mongoConnect)
	protected static async cantUndefinedADbName(connect: Connect) {
		await databaseAssertUtil.assertThrowsWithoutDatabaseName(connect)
	}

	@test('can choose which fields to return (mongo)', mongoConnect)
	@test('can choose which fields to return (neDb)', neDbConnect)
	protected static async selectFields(connect: Connect) {
		await databaseAssertUtil.assertCanReturnOnlySelectFields(connect)
	}

	@test('can search by regex (mongo)', mongoConnect)
	@test('can search by regex (neDb)', neDbConnect)
	protected static async canSearchByRegx(connect: Connect) {
		await databaseAssertUtil.assertCanSearchByRegex(connect)
	}

	@test('can $push to array (mongo)', mongoConnect)
	@test('can $push to array (neDb)', neDbConnect)
	protected static async can$pushOnUpsert(connect: Connect) {
		await databaseAssertUtil.assertCanPushToArrayOnUpsert(connect)
	}
}

export let dbCount = 0
export type Connect = (
	connectionString?: string,
	dbName?: string
) => Promise<Database>
