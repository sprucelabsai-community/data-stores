import { test } from '@sprucelabs/test-utils'
import MongoDatabase, { MONGO_TEST_URI } from '../../databases/MongoDatabase'
import NeDbDatabase from '../../databases/NeDbDatabase'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import databaseAssertUtil from '../../tests/databaseAssertUtil'
import { Database } from '../../types/database.types'

let dbCount = 0
async function mongo(dbConnectionString = MONGO_TEST_URI, dbName?: string) {
	const name = dbName ?? `mercury_${new Date().getTime()}-${dbCount++}`
	const database = new MongoDatabase(dbConnectionString, { dbName: name })

	await database.connect()

	return database
}

async function neDb() {
	const database = new NeDbDatabase()
	await database.connect()
	return database
}

export type Connect = (
	connectionString?: string,
	dbName?: string
) => Promise<Database>

export default class MongoDatabaseTest extends AbstractDatabaseTest {
	@test('throws error when updating record not found (mongo)', mongo)
	@test('throws error when updating record not found (neDb)', neDb)
	protected static async throwsErrorWhenUpdatingRecordNotFound(
		connect: Connect
	) {
		await databaseAssertUtil.assertThrowsWhenUpdatingRecordNotFound(connect)
	}

	@test('inserting generates id (mongo)', mongo)
	@test('inserting generates id (neDb)', neDb)
	protected static async insertingGeneratesId(connect: Connect) {
		await databaseAssertUtil.assertInsertingGeneratesId(connect)
	}

	@test('can sort asc on finds (mongo)', mongo)
	@test('can sort asc on finds (neDb)', neDb)
	protected static async canSortAscResults(connect: Connect) {
		await databaseAssertUtil.assertCanSortAsc(connect)
	}

	@test('can sort desc (mongo)', mongo)
	@test('can sort desc (neDb)', neDb)
	protected static async canSortDescResults(connect: Connect) {
		await databaseAssertUtil.assertCanSortDesc(connect)
	}

	@test('sort by id (mongo)', mongo)
	@test('sort by id (neDb)', neDb)
	protected static async canSortById(connect: Connect) {
		await databaseAssertUtil.assertCanSortById(connect)
	}

	@test('can update record (mongo)', mongo)
	@test('can update record (neDb)', neDb)
	protected static async canUpdate(connect: Connect) {
		await databaseAssertUtil.assertCanUpdate(connect)
	}

	@test('can find with $or', mongo)
	protected static async canQueryWithOr(connect: Connect) {
		await databaseAssertUtil.assertCanQueryWithOr(connect)
	}

	@test('update many (mongo)', mongo)
	@test('update many (neDb)', neDb)
	protected static async updateMany(connect: Connect) {
		await databaseAssertUtil.assertCanUpdateMany(connect)
	}

	@test('can create many (mongo)', mongo)
	@test('can create many (neDb)', neDb)
	protected static async canCreateMany(connect: Connect) {
		await databaseAssertUtil.assertCanCreateMany(connect)
	}

	@test('can push onto array (mongo)', mongo)
	@test('can push onto array (neDb)', neDb)
	protected static async canPush(connect: Connect) {
		await databaseAssertUtil.assertCanPushOntoArrayValue(connect)
	}

	@test('find with invalid id returns empty results (mongo)', mongo)
	@test('find with invalid id returns empty results  (neDb)', neDb)
	protected static async getEmptyResultFind(connect: Connect) {
		await databaseAssertUtil.assertEmptyDatabaseReturnsEmptyArray(connect)
	}

	@test('findOne with invalid id returns empty results (mongo)', mongo)
	@test('findOne with invalid id returns empty results  (neDb)', neDb)
	protected static async getEmptyResultsFindOne(connect: Connect) {
		await databaseAssertUtil.assertFindOneOnEmptyDatabaseReturnsNull(connect)
	}

	@test('can limit results (mongo)', mongo)
	@test('can limit results (neDb)', neDb)
	protected static async canLimitResults(connect: Connect) {
		await databaseAssertUtil.assertCanLimitResults(connect)
	}

	@test('can limit to zero results (mongo)', mongo)
	@test('can limit to zero results (neDb)', neDb)
	protected static async canLimitToZeroResults(connect: Connect) {
		await databaseAssertUtil.assertCanLimitResultsToZero(connect)
	}

	@test('can delete record (mongo)', mongo)
	@test('can delete record (neDb)', neDb)
	protected static async canDeleteRecord(connect: Connect) {
		await databaseAssertUtil.assertCanDeleteRecord(connect)
	}

	@test('can delete one (mongo)', mongo)
	@test('can delete one (neDb)', neDb)
	protected static async canDeleteOne(connect: Connect) {
		await databaseAssertUtil.assertCanDeleteOne(connect)
	}

	@test('can upsert (mongo)', mongo)
	@test('can upsert (neDb)', neDb)
	protected static async canUpsert(connect: Connect) {
		await databaseAssertUtil.assertCanShutdown(connect)
	}

	@test('has no unique indexes to start (mongo)', mongo)
	@test('has no unique indexes to start (neDb)', neDb)
	protected static async hasNoUniqueIndexToStart(connect: Connect) {
		await databaseAssertUtil.assertHasNoUniqueIndexToStart(connect)
	}

	@test('can create multiple unique indexes (mongo)', mongo)
	@test('can create multiple unique indexes (neDb)', neDb)
	protected static async canCreateUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateUniqueIndex(connect)
	}

	@test('can create a compound field unique index (mongo)', mongo)
	@test('can create a compound field unique index (neDb)', neDb)
	protected static async canCreateMultiFieldUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateMultiFieldUniqueIndex(connect)
	}

	@test("can't create the same unique indexes twice (mongo)", mongo)
	@test("can't create the same unique indexes twice (neDb)", neDb)
	protected static async cantCreateSameUniqueIndexTwice(connect: Connect) {
		await databaseAssertUtil.assertCantCreateUniqueIndexTwice(connect)
	}

	@test('can drop a unique index (mongo)', mongo)
	@test('can drop a unique index (neDb)', neDb)
	protected static async canDropUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropUniqueIndex(connect)
	}

	@test('can drop compound unique index (mongo)', mongo)
	@test('can drop compound unique index (neDb)', neDb)
	protected static async canDropCompoundUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropCompoundUniqueIndex(connect)
	}

	@test("can't drop unique index that doesn't exist (mongo)", mongo)
	@test("can't drop unique index that doesn't exist (neDb)", neDb)
	protected static async cantDropUniqueIndexThatDoesntExist(connect: Connect) {
		await databaseAssertUtil.assertCantDropUniqueIndexThatDoesntExist(connect)
	}

	@test("can't drop index when no indexes exist (mongo)", mongo)
	@test("can't drop index when no indexes exist (neDb)", neDb)
	protected static async cantDropIndexWhenNoIndexExist(connect: Connect) {
		await databaseAssertUtil.assertCantDropIndexWhenNoIndexExists(connect)
	}

	@test("can't drop compound unique index that doesn't exist (mongo)", mongo)
	@test("can't drop compound unique index that doesn't exist (neDb)", neDb)
	protected static async cantDropCompoundUniqueIndexThatDoesntExist(
		connect: Connect
	) {
		await databaseAssertUtil.assertCantDropCompoundUniqueIndexThatDoesntExist(
			connect
		)
	}

	@test('syncUniqueIndexes adds missing indexes (mongo)', mongo)
	@test('syncUniqueIndexes adds missing indexes (neDb)', neDb)
	protected static async syncUniqueIndexesAddsMissingIndexes(connect: Connect) {
		await databaseAssertUtil.assertSyncingUniqueIndexsAddsMissingIndexes(
			connect
		)
	}

	@test('syncUniqueIndexes skips existing indexes (mongo)', mongo)
	@test('syncUniqueIndexes skips existing indexes (neDb)', neDb)
	protected static async syncUniqueIndexesSkipsExistingIndexes(
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncingUniqueIndexsSkipsExistingIndexs(
			connect
		)
	}

	@test('syncUniqueIndexes removes extra indexes (mongo)', mongo)
	@test('syncUniqueIndexes removes extra indexes (neDb)', neDb)
	protected static async syncUniqueIndexesRemovesExtraIndexes(
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncingUniqueIndexesRemovesExtraIndexes(
			connect
		)
	}

	@test('syncUniqueIndexes multiple times with different keys (mongo)', mongo)
	@test('syncUniqueIndexes multiple times with different keys (neDb)', neDb)
	protected static async syncUniqueIndexesMultipleUpdates(connect: Connect) {
		await databaseAssertUtil.assertSyncingUniqueIndexesIsRaceProof(connect)
	}

	@test(
		'syncUniqueIndexes does not remove and add existing indexes (mongo)',
		mongo
	)
	@test(
		'syncUniqueIndexes does not remove and add existing indexes (neDb)',
		neDb
	)
	protected static async syncUniqueIndexesDoesNotRemoveAndAddExistingIndexes(
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncingIndexesDoesNotAddAndRemove(connect)
	}

	@test('can create a unique index that blocks duplicates (mongo)', mongo)
	@test('can create a unique index that blocks duplicates (neDb)', neDb)
	protected static async canCreateUniqueIndexBlocksDuplicates(
		connect: Connect
	) {
		await databaseAssertUtil.assertUniqueIndexBlocksDuplicates(connect)
	}

	@test('duplicate Keys On Insert Throws SpruceError (mongo)', mongo)
	@test('duplicate Keys On Insert Throws SpruceError (neDb)', neDb)
	protected static async duplicateKeysOnInsertThrowsSpruceError(
		connect: Connect
	) {
		await databaseAssertUtil.assertDuplicateKeyThrowsOnInsert(connect)
	}

	@test(
		'syncing Unique Index On Duped Fields Throws SpruceError (mongo)',
		mongo
	)
	@test('syncing Unique Index On Duped Fields Throws SpruceError (neDb)', neDb)
	protected static async settingUniqueIndexOnDupedFieldsThrowsSpruceError(
		connect: Connect
	) {
		await databaseAssertUtil.assertSettingUniqueIndexViolationThrowsSpruceError(
			connect
		)
	}

	@test('can create unique index based on nested field (mongo)', mongo)
	@test('can create unique index based on nested field (neBd)', neDb)
	protected static async nestedFieldIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateUniqueIndexOnNestedField(connect)
	}

	@test(
		'can upsert record updating only changed field with unique index (mongo)',
		mongo
	)
	@test(
		'can upsert record updating only changed field with unique index (neDb)',
		neDb
	)
	protected static async upsertWithUniqueIndex(connect: Connect) {
		await databaseAssertUtil.assertUpsertWithUniqueIndex(connect)
	}

	@test(
		'can update record with unique index based on nested field (mongo)',
		mongo
	)
	@test(
		'can update record with unique index based on nested field (neBd)',
		neDb
	)
	protected static async nestedFieldIndexUpdate(connect: Connect) {
		await databaseAssertUtil.assertNestedFieldIndexUpdates(connect)
	}

	@test('has no indexes to start (mongo)', mongo)
	@test('has no indexes to start (neDb)', neDb)
	protected static async hasNoIndexToStart(connect: Connect) {
		await databaseAssertUtil.assertHasNoIndexToStart(connect)
	}

	@test('can create multiple indexes (mongo)', mongo)
	@test('can create multiple indexes (neDb)', neDb)
	protected static async canCreateIndex(connect: Connect) {
		await databaseAssertUtil.assertCanCreateIndex(connect)
	}

	@test("can't create the same indexes twice (mongo)", mongo)
	@test("can't create the same indexes twice (neDb)", neDb)
	protected static async cantCreateSameIndexTwice(connect: Connect) {
		await databaseAssertUtil.assertCantCreateSameIndexTwice(connect)
	}

	@test('can create a compound field index 1 (mongo)', mongo, [
		'field',
		'field2',
	])
	@test('can create a compound field index 1 (neDb)', neDb, ['field', 'field2'])
	@test('can create a compound field index 2 (mongo)', mongo, [
		'otherField',
		'otherField2',
	])
	@test('can create a compound field index 2 (neDb)', neDb, [
		'otherField',
		'otherField2',
	])
	protected static async canCreateMultiFieldIndex(
		connect: Connect,
		fields: any
	) {
		await databaseAssertUtil.assertCanCreateMultiFieldIndex(connect, fields)
	}

	@test('can drop a index (mongo)', mongo)
	@test('can drop a index (neDb)', neDb)
	protected static async canDropIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropIndex(connect)
	}

	@test('can drop a compound index (mongo)', mongo)
	@test('can drop a compound index (neDb)', neDb)
	protected static async canDropCompoundIndex(connect: Connect) {
		await databaseAssertUtil.assertCanDropCompoundIndex(connect)
	}

	@test("can't drop compound  index that doesn't exist (mongo)", mongo)
	@test("can't drop compound  index that doesn't exist (neDb)", neDb)
	protected static async cantDropCompoundIndexThatDoesntExist(
		connect: Connect
	) {
		await databaseAssertUtil.assertCantDropCompoundIndexThatDoesNotExist(
			connect
		)
	}

	@test('syncIndexes skips existing indexes (mongo)', mongo)
	@test('syncIndexes skips existing indexes (neDb)', neDb)
	protected static async syncIndexesSkipsExistingIndexes(connect: Connect) {
		await databaseAssertUtil.assertSyncIndexesSkipsExisting(connect)
	}

	@test('syncIndexes removes extra indexes (neDb)', neDb)
	protected static async syncIndexesRemovesExtraIndexes(connect: Connect) {
		await databaseAssertUtil.assertSyncIndexesRemovesExtraIndexes(connect)
	}

	@test('syncIndexes multiple times with different keys (mongo)', mongo)
	@test('syncIndexes multiple times with different keys (neDb)', neDb)
	protected static async syncIndexesMultipleUpdates(connect: Connect) {
		await databaseAssertUtil.assertSyncIndexesHandlesRaceConditions(connect)
	}

	@test('syncIndexes does not remove and add existing indexes (mongo)', mongo)
	@test('syncIndexes does not remove and add existing indexes (neDb)', neDb)
	protected static async syncIndexesDoesNotRemoveAndAddExistingIndexes(
		connect: Connect
	) {
		await databaseAssertUtil.assertSyncIndexesDoesNotRemoveExisting(connect)
	}

	@test(
		'can save, get back, update, and search against null+undefined undefined -> null (mongo)',
		mongo
	)
	@test(
		'can save, get back, update, and search against null+undefined undefined -> null (neDb)',
		neDb
	)
	protected static async canSaveAndGetNullAndUndefined(connect: Connect) {
		await databaseAssertUtil.assertCanSaveAndGetNullAndUndefined(connect)
	}

	// nodejs mongo lib can't upsert when searching against null field (or maybe non id field???)
	@test.skip(
		'can upsert against null+undefined undefined -> null (mongo)',
		mongo
	)
	@test('can upsert against null+undefined undefined -> null (neDb)', neDb)
	protected static async canUpsertNull(connect: Connect) {
		await databaseAssertUtil.assertCanUpsertNull(connect)
	}

	@test('can count (mongo)', mongo)
	@test('can count (neDb)', neDb)
	protected static async canCount(connect: Connect) {
		await databaseAssertUtil.assertCanCount(connect)
	}

	@test('can count on id (mongo)', mongo)
	@test('can count on id (neDb)', neDb)
	protected static async canCountOnId(connect: Connect) {
		await databaseAssertUtil.assertCanCountOnId(connect)
	}

	@test('can find by id with $in (mongo)', mongo)
	@test('can find by id with $in (neDb)', neDb)
	protected static async canFindWithIn(connect: Connect) {
		await databaseAssertUtil.assertCanFindWithIn(connect)
	}

	@test('can find by id with $ne (mongo)', mongo)
	@test('can find by id with $ne (neDb)', neDb)
	protected static async canFindWithNe(connect: Connect) {
		await databaseAssertUtil.assertCanFindWithNe(connect)
	}

	@test(
		'provides helpful duplicate field error with multiple indexes, one at a time (mongo)',
		mongo
	)
	@test(
		'provides helpful duplicate field error with multiple indexes, one at a time (neDb)',
		neDb
	)
	protected static async duplicateFieldsOnMultipleUniqueIndexesHitOneAtATime(
		connect: Connect
	) {
		await databaseAssertUtil.assertDuplicateFieldsWithMultipleUniqueIndexesWorkAsExpected(
			connect
		)
	}

	@test('can find by $gt, $lt, $gte, $lte (mongo)', mongo)
	@test('can find by $gt, $lt, $gte, $lte (neDb)', neDb)
	protected static async canQueryByGtLtGteLte(connect: Connect) {
		await databaseAssertUtil.assertCanQueryByGtLtGteLte(connect)
	}

	@test('can search by path to sub object (mongo)', mongo)
	@test('can search by path to sub object (neDb)', neDb)
	protected static async canQueryByPathToSubObject(connect: Connect) {
		await databaseAssertUtil.assertCanQueryPathWithDotSyntax(connect)
	}

	@test('knows if connected (mongo)', mongo)
	@test('always connected (nedb)', neDb)
	protected static async knowsIfConnected(connect: Connect) {
		await databaseAssertUtil.assertKnowsIfConnectionClosed(connect)
	}

	@test('throws invalid connection string (mongo)', mongo)
	protected static async throwsInvalidConnectionString(connect: Connect) {
		await databaseAssertUtil.assertThrowsWithInvalidConnectionString(connect)
	}

	@test('throws unable to connect to db (mongo)', mongo)
	protected static async throwsWhenCantConnectToDb(connect: Connect) {
		await databaseAssertUtil.assertThrowsWhenCantConnect(connect)
	}

	@test("can't name a database undefined (mongo)", mongo)
	protected static async cantUndefinedADbName(connect: Connect) {
		await databaseAssertUtil.assertThrowsWithoutDatabaseName(connect)
	}

	@test('can choose which fields to return (mongo)', mongo)
	@test('can choose which fields to return (neDb)', neDb)
	protected static async selectFields(connect: Connect) {
		await databaseAssertUtil.assertCanReturnOnlySelectFields(connect)
	}

	@test('can search by regex (mongo)', mongo)
	@test('can search by regex (neDb)', neDb)
	protected static async canSearchByRegx(connect: Connect) {
		await databaseAssertUtil.assertCanSearchByRegex(connect)
	}

	@test('can $push to array (mongo)', mongo)
	@test('can $push to array (neDb)', neDb)
	protected static async can$pushOnUpsert(connect: Connect) {
		await databaseAssertUtil.assertCanPushToArrayOnUpsert(connect)
	}
}
