import { test, assert, generateId } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import CustomPrimaryStore from './support/CustomPrimaryStore'
import CustomPrimaryStore2 from './support/CustomPrimaryStore2'
import CustomPrimaryStoreWithFieldNamedId from './support/CustomPrimaryWithFieldNamedId'

export default class StoresWithDifferentNamedIdFieldsTest extends AbstractStoreTest {
	private static customPrimaryStoreWithFieldNamedId: CustomPrimaryStoreWithFieldNamedId
	private static customPrimaryStore: CustomPrimaryStore
	private static customPrimaryStore2: CustomPrimaryStore2

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.stores.setStoreClass('customPrimary', CustomPrimaryStore)
		this.stores.setStoreClass('customPrimary2', CustomPrimaryStore2)
		this.stores.setStoreClass(
			'customPrimaryWithFieldNamedId',
			CustomPrimaryStoreWithFieldNamedId
		)

		this.customPrimaryStore = await this.stores.getStore('customPrimary')
		this.customPrimaryStore2 = await this.stores.getStore('customPrimary2')
		this.customPrimaryStoreWithFieldNamedId = await this.stores.getStore(
			'customPrimaryWithFieldNamedId'
		)
	}

	@test()
	protected static async canSaveRecordWithDifferentId1() {
		const created = await this.createOne()
		assert.isTruthy(created.customId1)
		//@ts-ignore
		assert.isFalsy(created.id)
	}

	@test()
	protected static async canUpdateRecordWithDifferentId1() {
		const created = await this.createOne()
		await this.customPrimaryStore.updateOne(
			{
				customId1: created.customId1,
			},
			{
				name: generateId(),
			}
		)
	}

	@test()
	protected static async canCreateManyWithCustomId() {
		await this.customPrimaryStore.create([
			this.generateValues(),
			this.generateValues(),
		])
	}

	@test()
	protected static async canUpsertWithCustomId() {
		const created = await this.createOne()
		const upserted = await this.customPrimaryStore.upsertOne(
			{
				customId1: created.customId1,
			},
			{
				name: generateId(),
			}
		)
		assert.isTruthy(upserted.customId1)
		assert.isEqual(upserted.customId1, created.customId1)
	}

	@test()
	protected static async canSaveRecordWithDifferentId2() {
		const created = await this.customPrimaryStore2.createOne(
			this.generateValues()
		)

		assert.isTruthy(created.anotherCustomId)
		//@ts-ignore
		assert.isFalsy(created.id)
	}

	@test.skip('is this worth it for nedb?')
	protected static async canSaveWithDifferentIdEvenIfHasFieldNamedId() {
		const created = await this.customPrimaryStoreWithFieldNamedId.createOne(
			this.generateValues()
		)

		assert.isFalsy(created.id)
	}

	private static async createOne() {
		return await this.customPrimaryStore.createOne(this.generateValues())
	}

	private static generateValues() {
		return {
			name: generateId(),
		}
	}
}
