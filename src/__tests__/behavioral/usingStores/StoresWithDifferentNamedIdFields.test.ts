import { test, assert, generateId } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'

export default class StoresWithDifferentNamedIdFieldsTest extends AbstractStoreTest {
	@test()
	protected static async canSaveRecordWithDifferentId1() {
		const created = await this.createOne()
		assert.isTruthy(created.customId1)
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
