import CursorPager, { CursorQueryOptions } from '../../../cursors/CursorPager'
import { QueryOptions } from '../../../types/query.types'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'
import { SpyRecord } from '../usingStores/support/SpyStore'

export default abstract class AbstractCursorTest extends AbstractStoreTest {
	protected static spyRecordCount = 0

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.spyRecordCount = 0
	}

	protected static async createRecords(total: number) {
		return await Promise.all(
			new Array(total).fill(0).map(() => this.createRecord())
		)
	}

	protected static async createRecord(values?: SpyRecord) {
		return await this.spyStore.createOne({
			firstName: `Record ${this.spyRecordCount++}`,
			...values,
		})
	}

	protected static async find(
		query: Partial<SpyRecord>,
		options?: Partial<CursorQueryOptions>
	) {
		return await CursorPager.find(
			this.spyStore,
			query,
			this.mixinDefaultOptions({
				limit: 10,
				...options,
			})
		)
	}

	protected static mixinDefaultOptions(
		options: Partial<QueryOptions> & { limit: number }
	): CursorQueryOptions {
		return {
			next: null,
			previous: null,
			...options,
		}
	}

	protected static async createRecordsAndFind(options: {
		toCreate: number
		limit: number
	}) {
		const { toCreate, limit } = options
		await this.createRecords(toCreate)
		const results = await this.findWithOptions({ limit })
		return results
	}

	protected static async findWithOptions(
		options?: Partial<CursorQueryOptions>
	) {
		return await this.find(
			{},
			{
				...options,
			}
		)
	}
}
