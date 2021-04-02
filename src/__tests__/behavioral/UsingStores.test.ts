import {
	buildSchema,
	dropPrivateFields,
	makeFieldsOptional,
	SchemaValues,
} from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import SpruceError from '../../errors/SpruceError'
import StoreFactory from '../../factories/StoreFactory'
import AbstractStore, { SCRAMBLE_VALUE } from '../../stores/AbstractStore'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import {
	StoreOptions,
	PrepareOptions,
	PrepareResults,
} from '../../types/stores.types'

export const DEMO_PHONE = '555-555-5555'
export const DEMO_PHONE_FORMATTED = '+1 555-555-5555'
export const DEMO_PHONE2_FORMATTED = '+1 555-555-1234'
export const DEMO_PHONE3_FORMATTED = '+1 555-555-1235'
export const DEMO_PHONE4_FORMATTED = '+1 555-555-1236'

const fullRecordSchema = buildSchema({
	id: 'full-schema',
	name: 'Schema',
	fields: {
		id: {
			type: 'text',
			isRequired: true,
		},
		requiredForCreate: {
			type: 'text',
			isRequired: true,
		},
		requiredForFull: {
			type: 'text',
			isRequired: true,
		},
		requiredForUpdate: {
			type: 'text',
			isRequired: true,
		},
		privateField: {
			type: 'text',
			isPrivate: true,
			isRequired: true,
		},
		phoneNumber: {
			type: 'phone',
			isRequired: true,
		},
		relatedSchema: {
			type: 'schema',
			options: {
				schema: buildSchema({
					id: 'relatedTestSchema',
					fields: {
						textField: { type: 'text' },
						boolField: { type: 'boolean' },
					},
				}),
			},
		},
	},
})

const createRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'create-schema',
	fields: {
		...makeFieldsOptional(fullRecordSchema.fields),
		requiredForCreate: {
			...fullRecordSchema.fields.requiredForCreate,
		},
		phoneNumber: fullRecordSchema.fields.phoneNumber,
	},
})

const updateRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'update-schema',
	fields: {
		...makeFieldsOptional(dropPrivateFields(fullRecordSchema.fields)),
		requiredForUpdate: {
			...fullRecordSchema.fields.requiredForUpdate,
		},
	},
})

const databaseRecordSchema = buildSchema({
	...fullRecordSchema,
	id: 'database-schema',
	fields: {
		...fullRecordSchema.fields,
		requiredForDatabase: {
			type: 'boolean',
			isRequired: true,
		},
	},
})

const TEST_COLLECTION_NAME = 'test_collection'

declare module '../../types/stores.types' {
	interface StoreMap {
		testing: TestStore
	}

	interface StoreOptionsMap {
		testing: { testOption: boolean }
	}
}

class TestStore extends AbstractStore<
	typeof fullRecordSchema,
	typeof createRecordSchema,
	typeof updateRecordSchema,
	typeof databaseRecordSchema
> {
	public name = 'Test'

	protected scrambleFields = [
		'requiredForCreate',
		'requiredForFull',
		'requiredForUpdate',
		'privateField',
		'phoneNumber',
	]
	protected collectionName = TEST_COLLECTION_NAME
	protected fullSchema = fullRecordSchema
	protected createSchema = createRecordSchema
	protected updateSchema = updateRecordSchema
	protected databaseSchema = databaseRecordSchema

	protected willUpdate = undefined
	protected willScramble = undefined

	protected async willCreate(values: SchemaValues<typeof createRecordSchema>) {
		return {
			...values,
			requiredForCreate: values.requiredForCreate ?? 'generate for create',
			requiredForDatabase: true,
			requiredForFull: values.requiredForFull ?? 'generated for full',
			requiredForUpdate: values.requiredForUpdate ?? 'generated for update',
			privateField: values.privateField ?? 'generated for privateField',
		}
	}

	protected async prepareRecord<IncludePrivateFields extends boolean>(
		record: Partial<SchemaValues<typeof fullRecordSchema>> & {
			[key: string]: any
		},
		_?: PrepareOptions<IncludePrivateFields>
	): Promise<PrepareResults<typeof fullRecordSchema, IncludePrivateFields>> {
		const values: Record<string, any> = {
			...record,
			requiredForCreate: record.requiredForCreate || 'added here',
			requiredForUpdate: record.requiredForUpdate || 'added there',
			requiredForFull: record.requiredForFull || 'here it is!',
		}

		//@ts-ignore
		return values
	}

	public static Store(options: StoreOptions) {
		return new this(options.db)
	}
}

type RelatedSchemaType =
	| {
			textField?: string | null | undefined
			boolField?: boolean | null | undefined
	  }
	| null
	| undefined

export default class StoreStripsPrivateFieldsTest extends AbstractDatabaseTest {
	private static store: TestStore

	protected static async beforeEach() {
		await super.beforeEach()
		await this.connectToDatabase()
		const factory = StoreFactory.Factory(this.db)
		factory.setStore('testing', TestStore)
		this.store = await factory.Store('testing')
	}

	@test()
	protected static async canCreateTestStore() {
		assert.isTruthy(this.store)
	}

	@test()
	protected static async throwsWhenMissingRequiredOnCreate() {
		const err = (await assert.doesThrowAsync(
			//@ts-ignore
			() => this.store.createOne({})
		)) as SpruceError

		errorAssertUtil.assertError(err, 'INVALID_FIELD')
		assert.doesInclude(err, {
			'options.errors[].name': 'requiredForCreate',
		})
		assert.doesInclude(err, {
			'options.errors[].name': 'phoneNumber',
		})
	}

	@test()
	protected static async canCreateRecordAndDropPrivate() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		assert.isTruthy(created)
		assert.isTruthy(created.id)
		assert.isEqualDeep(created, {
			id: created.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			phoneNumber: DEMO_PHONE_FORMATTED,
			relatedSchema: null,
		})

		assert.isExactType<
			typeof created,
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				phoneNumber: string
			}
		>(true)

		//@ts-ignore
		assert.isFalsy(created.privateField)
	}

	@test()
	protected static async canCreateRecordAndKeepPrivateFields() {
		const created = await this.store.createOne(
			{
				requiredForCreate: 'yes!',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE_FORMATTED,
			},
			{ includePrivateFields: true }
		)

		assert.isExactType<
			typeof created,
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				privateField: string
				phoneNumber: string
				relatedSchema: RelatedSchemaType
			}
		>(true)

		assert.isEqualDeep(created, {
			id: created.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			privateField: 'private!',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})
	}

	@test()
	protected static async throwsWhenCantFindCreated() {
		const id = this.db.generateId()
		const err = (await assert.doesThrowAsync(
			//@ts-ignore
			() => this.store.updateOne({ id }, {})
		)) as SpruceError

		errorAssertUtil.assertError(err, 'RECORD_NOT_FOUND', {
			query: { id },
		})
	}

	@test()
	protected static async throwsWhenMissingRequiredOnUpdate() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			phoneNumber: DEMO_PHONE2_FORMATTED,
		})

		const err = (await assert.doesThrowAsync(
			//@ts-ignore
			() => this.store.updateOne({ id: created.id }, {})
		)) as SpruceError

		assert.doesInclude(err, {
			'options.errors[].name': 'requiredForUpdate',
		})
	}

	@test()
	protected static async updatesSuccessfullyDroppingPrivateFields() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const updated = await this.store.updateOne(
			{ id: created.id },
			{
				requiredForUpdate: 'for update!',
			}
		)

		assert.isEqualDeep(updated, {
			id: updated.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'for update!',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isEqual(updated.requiredForCreate, 'yes!')

		assert.isExactType<
			typeof updated,
			{
				id: string
				requiredForCreate: string
				requiredForUpdate: string
				requiredForFull: string
				phoneNumber: string
			}
		>(true)
	}

	@test()
	protected static async updatesSuccessfullyKeeepingPrivateFields() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const updated = await this.store.updateOne(
			{ id: created.id },
			{
				requiredForUpdate: 'for update!',
			},
			{ includePrivateFields: true }
		)

		assert.isEqualDeep(updated, {
			id: updated.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'for update!',
			privateField: 'private!',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isEqual(updated.requiredForCreate, 'yes!')

		assert.isExactType<
			typeof updated,
			{
				id: string
				requiredForCreate: string
				requiredForUpdate: string
				requiredForFull: string
				privateField: string
				phoneNumber: string
				relatedSchema: RelatedSchemaType
			}
		>(true)
	}

	@test()
	protected static async canFindOneRecordAndDropPrivateFields() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const match = await this.store.findOne({ id: created.id })

		assert.isTruthy(match)

		assert.isEqualDeep(match, {
			id: match.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isExactType<
			typeof match,
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				phoneNumber: string
			}
		>(true)
	}

	@test()
	protected static async canFindOneRecordAndKeepPrivateFields() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const match = await this.store.findOne(
			{ id: created.id },
			{ includePrivateFields: true }
		)

		assert.isTruthy(match)

		assert.isEqualDeep(match, {
			id: created.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			privateField: 'private!',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isExactType<
			typeof match,
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				privateField: string
				phoneNumber: string
				relatedSchema: RelatedSchemaType
			}
		>(true)
	}

	@test()
	protected static async canFindManyRecordAndDropPrivateFields() {
		const created1 = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const created2 = await this.store.createOne({
			requiredForCreate: 'yes2!',
			privateField: 'private2!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const matches = await this.store.find({})

		assert.isTruthy(matches)
		assert.isArray(matches)

		assert.isEqualDeep(matches[0], {
			id: created1.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isEqualDeep(matches[1], {
			id: created2.id,
			requiredForCreate: 'yes2!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isExactType<
			typeof matches[0],
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				phoneNumber: string
			}
		>(true)

		assert.isExactType<
			typeof matches[1],
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				phoneNumber: string
			}
		>(true)
	}

	@test()
	protected static async canCreateMany() {
		const values = [
			{
				requiredForCreate: '1 first',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE_FORMATTED,
			},
			{
				requiredForCreate: '2 second',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE2_FORMATTED,
			},
			{
				requiredForCreate: '3 third',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE3_FORMATTED,
			},
		]

		const created = await this.store.create(values, {
			includePrivateFields: true,
		})

		assert.isLength(created, values.length)

		for (const v of values) {
			assert.doesInclude(created, v)
		}
	}

	@test()
	protected static async whenOneFailsValidationNothingIsWritten() {
		const values = [
			{
				requiredForCreate: 'yes!',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE_FORMATTED,
			},
			{
				requiredForCreate: 'yes!',
				privateField: 'private!',
				phoneNumber: 'bad phone',
			},
			{
				requiredForCreate: 'yes!',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE3_FORMATTED,
			},
		]

		await assert.doesThrowAsync(() => this.store.create(values))
		const created = await this.store.count({})
		assert.isEqual(created, 0)
	}

	@test()
	protected static async canFindManyRecordAndKeepPrivateFields() {
		const created1 = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const created2 = await this.store.createOne({
			requiredForCreate: 'yes2!',
			privateField: 'private2!',
			phoneNumber: DEMO_PHONE2_FORMATTED,
		})

		const matches = await this.store.find(
			{},
			{},
			{ includePrivateFields: true }
		)

		assert.isTruthy(matches)
		assert.isArray(matches)

		assert.isEqualDeep(matches[0], {
			id: created1.id,
			requiredForCreate: 'yes!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			privateField: 'private!',
			phoneNumber: '+1 555-555-5555',
			relatedSchema: null,
		})

		assert.isEqualDeep(matches[1], {
			id: created2.id,
			requiredForCreate: 'yes2!',
			requiredForFull: 'generated for full',
			requiredForUpdate: 'generated for update',
			privateField: 'private2!',
			phoneNumber: '+1 555-555-1234',
			relatedSchema: null,
		})

		assert.isExactType<
			typeof matches[0],
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				privateField: string
				phoneNumber: string
				relatedSchema: RelatedSchemaType
			}
		>(true)

		assert.isExactType<
			typeof matches[1],
			{
				id: string
				requiredForCreate: string
				requiredForFull: string
				requiredForUpdate: string
				privateField: string
				phoneNumber: string
				relatedSchema: RelatedSchemaType
			}
		>(true)
	}

	@test()
	protected static async scrambleWithoutScrambleDefinedThrows() {
		//@ts-ignore
		this.store.scrambleFields = null
		const err = (await assert.doesThrowAsync(() =>
			this.store.scramble('taco')
		)) as SpruceError

		errorAssertUtil.assertError(err, 'SCRAMBLE_NOT_CONFIGURED')
	}

	@test()
	protected static async canScrambleRecord() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		await this.store.scramble(created.id)

		const match = await this.store.findOne({ id: created.id })

		assert.isTruthy(match)
		assert.isEqual(match.requiredForCreate, SCRAMBLE_VALUE)
		assert.isEqual(match.requiredForFull, SCRAMBLE_VALUE)
		assert.isEqual(match.requiredForUpdate, SCRAMBLE_VALUE)
		assert.isEqual(match.phoneNumber, SCRAMBLE_VALUE)
	}

	@test()
	protected static async throwsWhenPassingFieldThatDoesNotExist() {
		const err = (await assert.doesThrowAsync(() =>
			this.store.createOne({
				//@ts-ignore
				cheesyBurrito: 'yum-time',
				requiredForCreate: 'yes!',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE_FORMATTED,
			})
		)) as SpruceError

		errorAssertUtil.assertError(err, 'INVALID_FIELD')

		assert.doesInclude(err, {
			'options.errors[].name': 'cheesyBurrito',
		})
	}

	@test()
	protected static async normalizesOnCreate() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED.replace(/[^0-9]/g, ''),
		})

		assert.isEqual(created.phoneNumber, DEMO_PHONE_FORMATTED)

		const match = await this.db.findOne(TEST_COLLECTION_NAME, {})

		//@ts-ignore
		assert.isEqual(match.phoneNumber, DEMO_PHONE_FORMATTED)
	}

	@test()
	protected static async normalizesOnUpdate() {
		const created = await this.store.createOne({
			requiredForCreate: 'yes!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		const updated = await this.store.updateOne(
			{ id: created.id },
			{
				phoneNumber: DEMO_PHONE_FORMATTED.replace(/[^0-9]/g, ''),
				requiredForUpdate: 'already set',
			}
		)

		assert.isEqual(updated.phoneNumber, DEMO_PHONE_FORMATTED)

		const match = await this.db.findOne(TEST_COLLECTION_NAME, {})

		//@ts-ignore
		assert.isEqual(match.phoneNumber, DEMO_PHONE_FORMATTED)
	}

	@test()
	protected static async upsertCanCreateARecord() {
		const upserted = await this.store.upsertOne(
			{ phoneNumber: DEMO_PHONE_FORMATTED },
			{
				requiredForCreate: 'yes!',
				phoneNumber: DEMO_PHONE_FORMATTED,
				requiredForUpdate: 'created',
			}
		)

		assert.isTruthy(upserted)
		assert.isTruthy(upserted.id)
		assert.isEqual(upserted.requiredForUpdate, 'created')

		const match = await this.store.findOne({
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		assert.isTruthy(match)
		assert.isEqual(match.id, upserted.id)
		assert.isEqual(match.requiredForUpdate, 'created')
	}

	@test()
	protected static async upsertCanUpdateRecord() {
		const id = this.db.generateId()
		const created = await this.store.upsertOne(
			{ id },
			{
				id,
				requiredForUpdate: 'created',
				requiredForCreate: 'created!',
				privateField: 'private!',
				phoneNumber: DEMO_PHONE_FORMATTED,
			}
		)

		const upserted = await this.store.upsertOne(
			{ id: created.id },
			{
				phoneNumber: DEMO_PHONE2_FORMATTED,
				requiredForUpdate: 'required for update',
				requiredForCreate: 'updated',
			}
		)

		assert.isEqual(upserted.phoneNumber, DEMO_PHONE2_FORMATTED)

		const match = await this.store.findOne({
			phoneNumber: DEMO_PHONE2_FORMATTED,
		})

		assert.isTruthy(match)
		assert.isEqual(upserted.id, match.id)
		assert.isEqual(match.phoneNumber, DEMO_PHONE2_FORMATTED)
		assert.isEqual(match.requiredForUpdate, 'required for update')
	}

	@test()
	protected static async canCountRecords() {
		await this.store.createOne({
			requiredForUpdate: 'created',
			requiredForCreate: 'created!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		let count = await this.store.count()
		assert.isEqual(count, 1)

		await this.store.createOne({
			requiredForUpdate: 'created2',
			requiredForCreate: 'created2!',
			privateField: 'private2!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		count = await this.store.count()
		assert.isEqual(count, 2)

		await this.store.createOne({
			requiredForUpdate: 'created3',
			requiredForCreate: 'created3!',
			privateField: 'private!',
			phoneNumber: DEMO_PHONE_FORMATTED,
		})

		count = await this.store.count({ requiredForUpdate: 'created3' })
		assert.isEqual(count, 1)

		count = await this.store.count({ phoneNumber: DEMO_PHONE2_FORMATTED })
		assert.isEqual(count, 0)

		count = await this.store.count({ phoneNumber: DEMO_PHONE_FORMATTED })
		assert.isEqual(count, 3)
	}
}
