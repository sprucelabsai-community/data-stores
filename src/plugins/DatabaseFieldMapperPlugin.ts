import { KeyMapper } from '@sprucelabs/schema'
import { QueryOptions } from '../types/query.types'
import {
	DataStorePlugin,
	DataStorePluginPrepareResponse,
	DataStorePluginWillCreateOneResponse,
	DataStorePluginWillFindResponse,
	DataStorePluginWillUpdateOneResponse,
} from '../types/stores.types'

export default class DatabaseFieldMapperPlugin implements DataStorePlugin {
	private mapper: KeyMapper
	public constructor(map: Record<string, any>) {
		this.mapper = new KeyMapper(map)
	}
	public getName(): string {
		return 'fieldMapper'
	}

	public async willCreateOne(
		values: Record<string, any>
	): Promise<void | DataStorePluginWillCreateOneResponse> {
		return {
			newValues: this.mapper.mapTo(values),
		}
	}

	public async prepareRecord(
		record: Record<string, any>
	): Promise<void | DataStorePluginPrepareResponse> {
		return {
			newValues: this.mapper.mapFrom(record, { shouldThrowOnUnmapped: false }),
		}
	}

	public async willUpdateOne(
		query: Record<string, any>,
		updates: Record<string, any>
	): Promise<void | DataStorePluginWillUpdateOneResponse> {
		return {
			query: this.mapper.mapTo(query),
			newValues: this.mapper.mapTo(updates),
		}
	}

	public async willFind(
		query: Record<string, any>,
		options?: QueryOptions
	): Promise<void | DataStorePluginWillFindResponse> {
		let { sort } = options ?? {}

		sort = sort?.map((s) => ({
			...s,
			field: this.mapper.mapFieldNameTo(s.field),
		}))
		return {
			query: this.mapper.mapTo(query),
			options: {
				...options,
				sort,
			},
		}
	}
}
