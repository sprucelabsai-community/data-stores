import CursorPager, {
	CursorQueryOptions,
	RecordsWithCursors,
	SimpleStore,
} from './CursorPager'

export default class CursorPagerFaker {
	private static originalFind: <
		S extends SimpleStore,
		Find extends S['find'] = S['find'],
		Query extends Parameters<Find>[0] = Parameters<Find>[0],
		PromisedResponse extends ReturnType<Find> = ReturnType<Find>,
		Response extends PromisedResponse extends Promise<infer U>
			? U
			: PromisedResponse = PromisedResponse extends Promise<infer U>
			? U
			: PromisedResponse
	>(
		store: S,
		query: Query,
		options: CursorQueryOptions
	) => Promise<RecordsWithCursors<Response>>

	public static setResponse(
		response: (
			store: SimpleStore,
			query: Record<string, any>,
			options: CursorQueryOptions
		) => Promise<Partial<RecordsWithCursors<Record<string, any>[]>>>
	) {
		//@ts-ignore
		CursorPager.find = async (...args: any[]) => {
			//@ts-ignore
			const results = await response(...args)
			return {
				next: null,
				previous: null,
				records: [],
				...results,
			}
		}
	}

	public static async beforeEach() {
		if (!this.originalFind) {
			this.originalFind = CursorPager.find.bind(CursorPager)
		} else {
			CursorPager.find = this.originalFind
		}
	}
}
