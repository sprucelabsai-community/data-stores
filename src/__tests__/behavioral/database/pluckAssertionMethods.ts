import databaseAssertUtil from '../../../tests/databaseAssertUtil';

export function pluckAssertionMethods(util: typeof databaseAssertUtil) {
	return Object.keys(util).filter((key) => key.startsWith('assert')
	) as (keyof typeof databaseAssertUtil)[];
}
