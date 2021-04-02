import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
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

	protected static setCwd(suffix = '') {
		this.cwd =
			this.resolvePath(
				__dirname,
				'..',
				'/testDirsAndFiles/',
				'one-good-store-skill',
				'src'
			) + suffix

		return this.cwd
	}
}
