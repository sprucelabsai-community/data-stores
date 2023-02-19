import databaseAssertUtil from './databaseAssertUtil'

export default function pluckAssertionMethods(util: typeof databaseAssertUtil) {
	return Object.keys(util).filter((key) =>
		key.startsWith('assert')
	) as (keyof typeof databaseAssertUtil)[]
}
