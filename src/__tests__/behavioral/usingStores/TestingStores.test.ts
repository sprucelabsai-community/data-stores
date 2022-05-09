import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import StoreFixture from '../../../fixtures/StoreFixture'

export default class TestingStoresTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateTestingStores() {
		const fixture = new StoreFixture(this.getActiveDir())
		assert.isTruthy(fixture)
	}

	@test()
	protected static async canLoadStores() {
		const fixture = new StoreFixture(this.getActiveDir())
		const factory = await fixture.Factory()
		const names = factory.getStoreNames()
		assert.isLength(names, 1)
	}

	protected static getActiveDir() {
		this.cwd = this.resolvePath(
			__dirname,
			'..',
			'..',
			'/testDirsAndFiles/',
			'one-good-store-skill',
			'src'
		)

		return this.cwd
	}
}
