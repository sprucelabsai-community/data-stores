import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import StoreFactory from '../../factories/StoreFactory'
import DatabaseFixture from '../../fixtures/DatabaseFixture'
import StoreLoader from '../../loaders/StoreLoader'

export default class LoadingStoresTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateLoadingStores() {
		const loadingStores = await LoadingStoresTest.Loader()
		assert.isTruthy(loadingStores)
	}

	private static async Loader(storesDir?: string) {
		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		return StoreLoader.Loader(storesDir ?? this.cwd, db)
	}

	@test()
	protected static async loadsNoStoresWithDirWithNoStores() {
		const loader = await this.Loader(diskUtil.createRandomTempDir())
		const factory = await loader.loadStores()
		assert.isTrue(factory instanceof StoreFactory)
		assert.isLength(factory.getStoreNames(), 0)
	}

	@test('loads good stores without trailing slash')
	@test('loads good stores with trailing slash', '/')
	protected static async loadsStoresWithGoodDir(pathSuffix = '') {
		this.setCwd(pathSuffix)

		const loader = await this.Loader(this.resolvePath(this.cwd))
		const factory = await loader.loadStores()
		assert.isLength(factory.getStoreNames(), 1)
		assert.isEqualDeep(factory.getStoreNames(), ['good'])
	}

	@test()
	protected static async loadsSameStoreWithAndWithoutTrailingSlash() {
		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		this.setCwd('')

		const loader1 = await StoreLoader.getInstance(
			this.resolvePath(this.cwd),
			db
		)

		const loader2 = await StoreLoader.getInstance(
			this.resolvePath(this.cwd) + '/',
			db
		)

		assert.isEqual(loader1, loader2)
	}

	@test()
	protected static async throwsWithBadStore() {
		this.setCwd(undefined, 'bad')

		const loader = await this.Loader(this.resolvePath(this.cwd))
		const err = await assert.doesThrowAsync(() => loader.loadStores())

		errorAssert.assertError(err, 'FAILED_TO_LOAD_STORES')
		//@ts-ignore
		assert.isLength(err.options.errors, 1)
	}

	@test()
	protected static async canGetSharedInstance() {
		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		const loader = await StoreLoader.getInstance(this.cwd, db)
		//@ts-ignore
		loader._monkeyPatched = true

		const loader2 = await StoreLoader.getInstance(this.cwd, db)
		//@ts-ignore
		assert.isTrue(loader2._monkeyPatched)
	}

	@test()
	protected static async getsNewInstanceWithDifferentCwd() {
		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		const loader = await StoreLoader.getInstance(this.cwd, db)
		//@ts-ignore
		loader._monkeyPatched = true

		const loader2 = await StoreLoader.getInstance(this.cwd + '/testing', db)
		//@ts-ignore
		assert.isUndefined(loader2._monkeyPatched)
	}

	@test()
	protected static async instanceThrowsIfCwdAndDbNotSet() {
		const err = await assert.doesThrowAsync(() => StoreLoader.getInstance())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['cwd', 'database'],
		})
	}

	@test()
	protected static async canSetStoreDirForInstance() {
		this.setCwd(undefined, 'good')

		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		StoreLoader.setStoreDir(this.cwd)

		const loader = await StoreLoader.getInstance(undefined, db)

		const factory = await loader.loadStores()
		const names = factory.getStoreNames()
		assert.isLength(names, 1)
		assert.isEqual(names[0], 'good')
	}

	@test()
	protected static async canSetDbForInstance() {
		this.setCwd(undefined, 'good')

		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		StoreLoader.setStoreDir(this.cwd)
		StoreLoader.setDatabase(db)

		const loader = await StoreLoader.getInstance(undefined, undefined)

		const factory = await loader.loadStores()
		const names = factory.getStoreNames()

		assert.isLength(names, 1)
		assert.isEqual(names[0], 'good')
	}

	protected static setCwd(suffix = '', goodOrBad: 'good' | 'bad' = 'good') {
		this.cwd =
			this.resolvePath(
				__dirname,
				'..',
				'/testDirsAndFiles/',
				`one-${goodOrBad}-store-skill`,
				'src'
			) + suffix

		return this.cwd
	}
}
