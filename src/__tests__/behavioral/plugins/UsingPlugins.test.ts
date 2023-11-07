import { test, assert, generateId, errorAssert } from '@sprucelabs/test-utils'
import {
	DataStorePlugin,
	DataStorePluginHookResponse,
	DataStorePluginWillDeleteOneResponse,
	DataStorePluginWillUpdateOneResponse,
} from '../../../types/database.types'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'
import { SpyRecord } from '../usingStores/support/SpyStore'

export default class UsingPluginsTest extends AbstractStoreTest {
	private static plugin: MockPlugin
	private static collectionName: string
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()

		this.collectionName = generateId()
		this.plugin = new MockPlugin()
		this.spyStore.addPlugin(this.plugin)
		this.spyStore.setCollectionName(this.collectionName)
	}

	@test()
	protected static async createOneGetsExpectedParams() {
		const { created, values } = await this.createOne()

		this.plugin.assertWillCreateOneParameters({
			id: created.id,
			...values,
		})
	}

	@test()
	protected static async handlesMultiplePluginsOnCreateOne() {
		const plugin = this.addAnotherPlugin()

		const { created, values } = await this.createOne()

		plugin.assertWillCreateOneParameters({
			id: created.id,
			...values,
		})
	}

	@test()
	protected static async updateOneGetsExpectedParams() {
		const { query, updates } = await this.randomlyUpdateOne()
		this.plugin.assertWillUpdateOneParameters(query, updates)
	}

	@test()
	protected static async handlesMultiplePluginsOnUpdateOne() {
		const plugin = this.addAnotherPlugin()

		const { query, updates } = await this.randomlyUpdateOne()

		plugin.assertWillUpdateOneParameters(query, updates)
	}

	@test('can mixin values to return on create one 1', {
		cheesy: 'burrito',
	})
	@test('can mixin values to return on create one 2', {
		taco: 'bravo',
	})
	protected static async pluginCanMixinValuesToReturnOnCreateOne(
		values: Record<string, any>
	) {
		this.plugin.setMixinOnCreateValues(values)

		const { created } = await this.createOne()

		assert.doesInclude(created, values)
	}

	@test()
	protected static async multiplePluginsCanMixinValuesToReturnOnCreateOne() {
		const values1 = {
			what: 'the?',
		}
		this.plugin.setMixinOnCreateValues(values1)

		const plugin = this.addAnotherPlugin()

		const values2 = {
			easy: 'peasy',
		}

		plugin.setMixinOnCreateValues(values2)

		const { created } = await this.createOne()

		assert.doesInclude(created, {
			...values1,
			...values2,
		})
	}

	@test()
	protected static async pluginCanModifyQueryOnUpdateOne() {
		this.plugin.setQueryToReturnOnWillUpdateOne({
			firstName: 'Tay',
		})

		const { created: created1 } = await this.createOne({
			firstName: 'Tay',
		})

		const { created: created2 } = await this.createOne({
			firstName: 'Eric',
			extraField: generateId(),
		})

		const updated = await this.updateOne(
			{ id: created2.id! },
			{
				lastName: 'Jay',
			}
		)

		assert.isEqual(updated.id, created1.id)

		const match = await this.spyStore.findOne({ lastName: 'Jay' })

		assert.isEqual(match?.id, created1.id)
		assert.isEqual(match?.firstName, 'Tay')
		assert.isFalsy(match?.extraField)

		assert.isEqualDeep(this.spyStore.lastWillUpdateRecord, created1)
	}

	@test()
	protected static async throwsNotFoundIfQueryReturnedReturnsNoResults() {
		this.plugin.setQueryToReturnOnWillUpdateOne({
			firstName: generateId(),
		})

		await this.createOne()

		const err = await assert.doesThrowAsync(() =>
			this.updateOne(
				{},
				{
					firstName: generateId(),
				}
			)
		)

		errorAssert.assertError(err, 'RECORD_NOT_FOUND')
	}

	@test()
	protected static async deleteOneGetsExpectedParams() {
		const { created } = await this.createOne()

		const query = {
			id: created.id!,
		}

		assert.doesThrow(() => this.plugin.assertWillDeleteOneParameters(query))

		await this.deleteOne(query)

		this.plugin.assertWillDeleteOneParameters(query)
	}

	@test()
	protected static async handlesMultiplePluginsOnDeleteOne() {
		const plugin = this.addAnotherPlugin()

		const { created } = await this.createOne()

		const query = {
			id: created.id!,
		}

		await this.deleteOne(query)

		plugin.assertWillDeleteOneParameters(query)
	}

	@test()
	protected static async deleteOneCanUpdateQuery() {
		const { created: c1 } = await this.createOne()
		const { created: c2 } = await this.createOne()

		this.plugin.setQueryToReturnOnWillDeleteOne({
			id: c1.id,
		})

		await this.deleteOne({
			id: c2.id,
		})

		const count = await this.spyStore.count({ id: c1.id! })
		assert.isEqual(count, 0)
	}

	private static async deleteOne(query: Record<string, any>) {
		await this.spyStore.deleteOne(query as any)
	}

	private static async updateOne(
		query: Partial<SpyRecord>,
		updates: Partial<SpyRecord>
	) {
		return await this.spyStore.updateOne(query as any, updates)
	}

	private static async randomlyUpdateOne() {
		const { created } = await this.createOne()
		const updates = this.generateRandomValues()

		const query = {
			id: created.id!,
		}

		await this.updateOne(query, updates)
		return { query, updates }
	}

	private static addAnotherPlugin() {
		const plugin = new MockPlugin()
		this.spyStore.addPlugin(plugin)
		return plugin
	}

	private static async createOne(v?: Partial<SpyRecord>) {
		const values = this.generateRandomValues()
		const created = await this.spyStore.createOne({ ...values, ...v })
		return { created, values }
	}

	private static generateRandomValues() {
		return {
			firstName: generateId(),
			lastName: generateId(),
		}
	}
}

class MockPlugin implements DataStorePlugin {
	private willCreateOneValues?: Record<string, any>
	private willUpdateOneParams?: {
		query: Record<string, any>
		updates: Record<string, any>
	}
	private mixinValuesOnCreate?: Record<string, any>
	private queryToReturnOnWillUpdateOne?: Record<string, any>
	private willDeleteOneQuery?: Record<string, any>
	private queryToReturnOnWillDeleteOne?: Record<string, any>

	public async willCreateOne(
		values: Record<string, any>
	): Promise<void | DataStorePluginHookResponse> {
		this.willCreateOneValues = values
		return {
			valuesToMixinBeforeReturning: this.mixinValuesOnCreate,
		}
	}

	public async willDeleteOne(
		query: Record<string, any>
	): Promise<void | DataStorePluginWillDeleteOneResponse> {
		this.willDeleteOneQuery = query
		return {
			query: this.queryToReturnOnWillDeleteOne,
		}
	}

	public async setQueryToReturnOnWillDeleteOne(query: Record<string, any>) {
		this.queryToReturnOnWillDeleteOne = query
	}

	public async willUpdateOne(
		query: Record<string, any>,
		updates: Record<string, any>
	): Promise<void | DataStorePluginWillUpdateOneResponse> {
		this.willUpdateOneParams = {
			query,
			updates,
		}

		return {
			query: this.queryToReturnOnWillUpdateOne,
		}
	}

	public assertWillUpdateOneParameters(
		query: Record<string, any>,
		updates: Record<string, any>
	) {
		assert.isEqualDeep(this.willUpdateOneParams?.query, query)
		assert.isEqualDeep(this.willUpdateOneParams?.updates, updates)
	}

	public assertWillCreateOneParameters(values: Record<string, any>) {
		assert.isEqualDeep(this.willCreateOneValues, {
			extraField: undefined,
			...values,
		})
	}

	public assertWillDeleteOneParameters(query: Record<string, any>) {
		assert.isEqualDeep(this.willDeleteOneQuery, query)
	}

	public getName(): string {
		return 'mock'
	}

	public setMixinOnCreateValues(mixinValues: Record<string, any>) {
		this.mixinValuesOnCreate = mixinValues
	}

	public setQueryToReturnOnWillUpdateOne(query: Record<string, any>) {
		this.queryToReturnOnWillUpdateOne = query
	}
}
