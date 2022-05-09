import StoreFactory from '../../../../factories/StoreFactory'
import AbstractDatabaseTest from '../../../../tests/AbstractDatabaseTest'
import DummyStore from './DummyStore'
import SpyStore from './SpyStore'

export default abstract class AbstractStoreTest extends AbstractDatabaseTest {
	protected static spyStore: SpyStore
	protected static dummyStore: DummyStore
	protected static factory: StoreFactory

	protected static async beforeEach() {
		await super.beforeEach()
		await this.connectToDatabase()
		this.factory = StoreFactory.Factory(this.db)
		this.factory.setStore('spy', SpyStore)
		this.factory.setStore('dummy', DummyStore)

		this.spyStore = await this.factory.Store('spy')
		this.dummyStore = await this.factory.Store('dummy')
	}
}
