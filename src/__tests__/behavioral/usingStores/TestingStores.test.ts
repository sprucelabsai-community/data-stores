import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import StoreFixture from '../../../fixtures/StoreFixture'

@suite()
export default class TestingStoresTest extends AbstractSpruceTest {
    @test()
    protected async canCreateTestingStores() {
        const fixture = new StoreFixture(this.getActiveDir())
        assert.isTruthy(fixture)
    }

    @test()
    protected async canLoadStores() {
        const fixture = new StoreFixture(this.getActiveDir())
        const factory = await fixture.Factory()
        const names = factory.getStoreNames()
        assert.isLength(names, 1)
    }

    protected getActiveDir() {
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
