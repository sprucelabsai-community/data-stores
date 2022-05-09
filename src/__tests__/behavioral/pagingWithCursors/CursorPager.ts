import { assertOptions } from '@sprucelabs/schema'
import { QueryOptions } from '../../../types/query.types'

export interface CursorQueryOptions extends Omit<QueryOptions, 'skip'> {
	limit: number
	next: string | null
	previous: string | null
}

interface InternalCursor {
	id: string
	last: string[]
	newest: string
}

interface Cursor<
	Response extends Record<string, any>[] = Record<string, any>[]
> {
	records: Response
	next: string | null
	previous: string | null
}

export default class CursorPager {
	public static async find<
		S extends SimpleStore,
		Find extends S['find'] = S['find'],
		Query extends Parameters<Find>[0] = Parameters<Find>[0],
		PromisedResponse extends ReturnType<Find> = ReturnType<Find>,
		Response extends UnPromisify<PromisedResponse> = UnPromisify<PromisedResponse>
	>(
		store: S,
		query: Query,
		options: CursorQueryOptions
	): Promise<Cursor<Response>> {
		const { next, previous, ...prepped } = this.prepareQueryOptions(options)

		let cursorQuery: Record<string, any> | undefined
		let newest: string | undefined

		if (previous) {
			prepped.skip = 2
		}

		if (next) {
			cursorQuery = {}
			const { sort } = prepped

			const cursor = this.parseCursor(next)
			const compare = sort[0].direction === 'asc' ? '$gt' : '$lt'

			if (cursor.last.length > 1) {
				const inverse = compare === '$lt' ? '$gte' : '$lte'
				newest = cursor.newest

				cursorQuery = {
					$or: [
						{
							[sort[0].field]: { [compare]: cursor.last[0] },
						},
						{
							[sort[0].field]: cursor.last[0],
							id: { $lt: cursor.id },
						},
						{
							[sort[0].field]: { [inverse]: cursor.last[0] },
							id: { $gt: cursor.newest },
						},
					],
				}
			} else {
				cursorQuery = {
					id: { [compare]: cursor.id },
				}
			}
		}

		const records = await store.find(
			!cursorQuery ? query : { $and: [cursorQuery, query] },
			prepped
		)

		let newNext: string | undefined

		if (records.length > options.limit) {
			records.pop()
			const extra = records[records.length - 1]
			newNext = this.encodeCursor({
				id: extra.id,
				newest: this.trackNewest(records, newest),
				last: prepped.sort.map((s) => extra[s.field] ?? null),
			})
		}

		return {
			records,
			next: newNext ?? null,
			previous: next ? '234' : null,
		}
	}

	private static trackNewest(records: any, newest: string | undefined): string {
		return [...records.map((r: Record<string, any>) => r.id), newest]
			.filter((id) => !!id)
			.sort()
			.pop()
	}

	private static parseCursor(next: string) {
		return JSON.parse(next) as InternalCursor
	}

	private static encodeCursor(cursor: InternalCursor): string {
		return JSON.stringify(cursor)
	}

	public static prepareQueryOptions<O extends QueryOptions & { limit: number }>(
		options: O
	): O & { sort: NonNullable<O['sort']> } {
		assertOptions(options, ['limit'])
		const sort = [...(options.sort ?? [])]

		if (!sort.find((p) => p.field === 'id')) {
			sort.push({
				field: 'id',
				direction: 'desc',
			})
		}

		return {
			...options,
			limit: options.limit + 1,
			sort,
		} as any
	}
}
interface SimpleStore {
	find: (...args: any[]) => Promise<any>
}
type UnPromisify<T> = T extends Promise<infer U> ? U : T
