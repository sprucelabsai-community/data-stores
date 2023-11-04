import { test, assert, generateId } from '@sprucelabs/test-utils'
import {
	DataStorePlugin,
	DataStorePluginHookResponse,
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
	protected static async pluginCanModifyQueryOnUpdate() {
		this.plugin.setQueryToReturnOnWillUpdateOne({
			firstName: 'Tay',
		})

		// const { created: created1 } = await this.createOne({
		// 	firstName: 'Tay',
		// })

		// const { created: created2 } = await this.createOne({
		// 	firstName: 'Eric',
		// })

		// const { updated } = await this.spyStore.updateOne(
		// 	{ id: created2.id! },
		// 	{
		// 		lastName: 'Jay',
		// 	}
		// )
	}

	private static async randomlyUpdateOne() {
		const { created } = await this.createOne()
		const updates = this.generateRandomValues()

		const query = {
			id: created.id!,
		}

		await this.spyStore.updateOne(query, updates)
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

	public async willCreateOne(
		values: Record<string, any>
	): Promise<void | DataStorePluginHookResponse> {
		this.willCreateOneValues = values
		return {
			valuesToMixinBeforeReturning: this.mixinValuesOnCreate,
		}
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
		assert.isEqualDeep(this.willCreateOneValues, values)
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
