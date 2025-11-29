import { assertOptions, SchemaError } from '@sprucelabs/schema'
import clone from 'just-clone'
import { QueryOptions } from '../types/query.types'

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

export interface RecordsWithCursors<
    Response extends Record<string, any>[] = Record<string, any>[],
> {
    records: Response
    next: string | null
    previous: string | null
}

type PrepareQueryOptions = CursorQueryOptions & {
    limit: number
}

export default class CursorPager {
    public static async find<
        S extends SimpleStore,
        Find extends S['find'] = S['find'],
        Query extends Parameters<Find>[0] = Parameters<Find>[0],
        PromisedResponse extends ReturnType<Find> = ReturnType<Find>,
        Response extends UnPromisify<PromisedResponse> =
            UnPromisify<PromisedResponse>,
    >(
        store: S,
        query: Query,
        options: CursorQueryOptions
    ): Promise<RecordsWithCursors<Response>> {
        const { next, previous, ...prepped } = this.prepareQueryOptions(options)

        let cursorQuery: Record<string, any> | undefined
        let newest: string | undefined

        if (next || previous) {
            cursorQuery = {}
            const { sort } = prepped
            const cursor = this.parseCursor((next ?? previous)!)
            let compare = sort[0].direction === 'asc' ? '$gt' : '$lt'

            if (cursor.last.length > 1) {
                let inverse = compare === '$lt' ? '$gte' : '$lte'
                newest = cursor.newest
                let sameNameCompare = '$lt'

                if (previous) {
                    sameNameCompare = '$gt'
                    inverse = compare
                }

                cursorQuery = {
                    $or: [
                        {
                            [sort[0].field]: { [compare]: cursor.last[0] },
                        },
                        {
                            [sort[0].field]: cursor.last[0],
                            id: { [sameNameCompare]: cursor.id },
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

        let newNextCursor: string | undefined

        const hasExtra = records.length > options.limit
        if (hasExtra) {
            records.pop()
        }

        if (previous) {
            records.reverse()
        }

        if (previous || hasExtra) {
            const record = records[records.length - 1]

            newNextCursor = this.encodeCursor({
                id: record.id,
                newest: this.trackNewest(records, newest),
                last: this.getSortFieldValuesFromRecord(prepped, record),
            })
        }

        let newPreviousCursor: string | undefined

        if (next || previous) {
            const record = records[0]
            newPreviousCursor = this.encodeCursor({
                id: record.id,
                newest: this.trackNewest(records, newest),
                last: this.getSortFieldValuesFromRecord(prepped, record),
            })
        }

        return {
            records,
            next: newNextCursor ?? null,
            previous: newPreviousCursor ?? null,
        }
    }

    private static getSortFieldValuesFromRecord(
        prepped: {
            limit: number
            sort: { field: string; direction: 'asc' | 'desc' }[]
            includeFields?: string[] | undefined
        },
        record: any
    ): string[] {
        return prepped.sort.map((s) => record[s.field] ?? null)
    }

    private static trackNewest(
        records: any,
        newest: string | undefined
    ): string {
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

    public static prepareQueryOptions<
        O extends PrepareQueryOptions = PrepareQueryOptions,
    >(options: O): O & { sort: NonNullable<O['sort']> } {
        const {
            previous,
            sort = [],
            limit,
        } = clone(assertOptions(options as PrepareQueryOptions, ['limit']))

        if (limit < 1) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['limit'],
                friendlyMessage: 'Your limit must be above zero!',
            })
        }

        if (!sort.find((p) => p.field === 'id')) {
            sort.push({
                field: 'id',
                direction: 'desc',
            })
        }

        if (previous) {
            for (const s of sort) {
                s.direction = s.direction === 'asc' ? 'desc' : 'asc'
            }
        }

        return {
            ...options,
            limit: limit + 1,
            sort,
        } as any
    }
}
export interface SimpleStore {
    find: (...args: any[]) => Promise<any>
}
type UnPromisify<T> = T extends Promise<infer U> ? U : T
