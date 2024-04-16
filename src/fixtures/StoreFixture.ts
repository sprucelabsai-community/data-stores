import StoreLoader from '../loaders/StoreLoader'
import DatabaseFixture from './DatabaseFixture'

export default class StoreFixture {
    private activeDir: string

    public constructor(activeDir: string) {
        this.activeDir = activeDir
    }

    public async Factory() {
        const dbFixture = new DatabaseFixture()
        const db = await dbFixture.connectToDatabase()

        const loader = await StoreLoader.Loader(this.activeDir, db)
        const factory = await loader.loadStores()

        return factory
    }
}
