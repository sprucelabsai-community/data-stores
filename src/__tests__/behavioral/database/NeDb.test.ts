import { test, assert, generateId } from '@sprucelabs/test-utils'
import NeDbDatabase from '../../../databases/NeDbDatabase'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import neDbConnect from '../../support/neDbConnect'

export default class NeDbTest extends AbstractDatabaseTest {
	private static client: NeDbDatabase

	private static readonly collectionName = 'people'

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		const { db } = await neDbConnect()
		this.client = db
	}

	@test()
	protected static async doesNotAddIdFieldWithDifferentPrimaryField() {
		const created = await this.createOne()
		assert.isFalsy(created.id)
	}

	@test()
	protected static async doesNotAddInIdFieldOnFindWithDifferentPrimaryField() {
		const created = await this.createOne()
		const found = await this.client.findOne(
			this.collectionName,
			{
				first: created.first,
			},
			{},
			{
				primaryFieldNames: ['personid'],
			}
		)
		assert.isTruthy(found)
		assert.isFalsy(found.id)
	}

	@test()
	protected static async doesNotAddInIdFieldWithManyResults() {
		await this.createOne()
		await this.createOne()

		const all = await this.client.find(
			this.collectionName,
			{},
			{},
			{
				primaryFieldNames: ['personid'],
			}
		)
		assert.isLength(all, 2)
		assert.isFalsy(all[0].id)
		assert.isFalsy(all[1].id)
	}

	private static async createOne(first?: string) {
		return await this.client.createOne(
			this.collectionName,
			{
				first: first ?? generateId(),
			},
			{
				primaryFieldNames: ['personid'],
			}
		)
	}
}
