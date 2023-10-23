import { Schema, SchemaFieldNames } from '@sprucelabs/schema'
import AbstractStore from '../stores/AbstractStore'
import { QueryOptions } from '../types/query.types'
import { PrepareOptions } from '../types/stores.types'

export default class BatchCursorImpl<ResponseRecord>
	implements BatchCursor<ResponseRecord>
{
	private store: AbstractStore<Schema>
	private options?: FindBatchOptions
	private query?: Record<string, any>
	private constructor(
		store: AbstractStore<Schema>,
		query?: Record<string, any>,
		options?: FindBatchOptions
	) {
		this.store = store
		this.query = query
		this.options = options
	}

	public static Cursor<Response>(
		store: AbstractStore<Schema>,
		query?: Record<string, any>,
		options?: FindBatchOptions
	) {
		return new this(store, query, options) as BatchCursor<Response>
	}

	public async next(): Promise<ResponseRecord[] | null> {
		const { batchSize = 10, ...rest } = this.options ?? {}

		const matches = await this.store.find(
			{ ...(this.query as any) },
			{
				limit: batchSize,
			},
			{
				...(rest as any),
			}
		)
		if (matches.length === 0) {
			return null
		}

		this.bumpCursorPosition(matches)

		return matches as ResponseRecord[]
	}

	private bumpCursorPosition(matches: Record<string, any>[]) {
		const last = matches[matches.length - 1]
		if (last) {
			if (!this.query) {
				this.query = {}
			}
			this.query.id = { $gt: last.id }
		}
	}
}

export interface FindBatchOptions<
	IncludePrivateFields extends boolean = true,
	FullSchema extends Schema = Schema,
	F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
> extends Omit<QueryOptions, 'includeFields'>,
		PrepareOptions<IncludePrivateFields, FullSchema, F> {
	batchSize?: number
}

export interface BatchCursor<ResponseRecord> {
	next(): Promise<ResponseRecord[] | null>
}
