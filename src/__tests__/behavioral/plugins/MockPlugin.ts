import { assert } from '@sprucelabs/test-utils'
import {
	DataStorePlugin,
	DataStorePluginHookResponse,
	DataStorePluginWillDeleteOneResponse,
	DataStorePluginWillUpdateOneResponse,
} from '../../../types/database.types'
import generateId from '../../../utilities/generateId'

export default class MockPlugin implements DataStorePlugin {
	private willCreateOneValues?: Record<string, any>
	private willUpdateOneParams?: {
		query: Record<string, any>
		updates: Record<string, any>
	}
	private mixinValuesOnCreate?: Record<string, any>
	private queryToReturnOnWillUpdateOne?: Record<string, any>
	private willDeleteOneQuery?: Record<string, any>
	private queryToReturnOnWillDeleteOne?: Record<string, any>

	private name = 'mock'

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

	public setQueryToReturnOnWillDeleteOne(query: Record<string, any>) {
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
		return this.name
	}

	public randomizeName() {
		this.name = generateId()
	}

	public setMixinOnCreateValues(mixinValues: Record<string, any>) {
		this.mixinValuesOnCreate = mixinValues
	}

	public setQueryToReturnOnWillUpdateOne(query: Record<string, any>) {
		this.queryToReturnOnWillUpdateOne = query
	}
}
