interface Mutex {
    promises: any[]
    resolvers: any[]
    count: number
}

export default abstract class AbstractMutexer {
    private mutexesByKey: Record<string, Mutex> = {}
    public async lock(key: string): Promise<void> {
        if (!this.mutexesByKey[key]) {
            this.mutexesByKey[key] = {
                promises: [],
                resolvers: [],
                count: 0,
            }
        }

        this.mutexesByKey[key].count++

        if (this.mutexesByKey[key].count === 1) {
            this.mutexesByKey[key].promises.push(
                new Promise((resolve) => resolve(undefined))
            )
            this.mutexesByKey[key].resolvers.push(() => {})
        } else {
            const resolver = (resolve: any): void => {
                this.mutexesByKey[key].resolvers.push(resolve)
            }
            const promise = new Promise(resolver)
            this.mutexesByKey[key].promises.push(promise)
        }

        return this.mutexesByKey[key].promises[this.mutexesByKey[key].count - 1]
    }

    public unlock(key: string) {
        if (this.mutexesByKey[key]) {
            this.mutexesByKey[key].promises.shift()
            this.mutexesByKey[key].resolvers.shift()
            this.mutexesByKey[key].count--

            if (this.mutexesByKey[key].count === 0) {
                delete this.mutexesByKey[key]
            } else {
                this.mutexesByKey[key].resolvers[0]()
            }
        }
    }

    public async isLocked(key: string): Promise<boolean> {
        return !!this.mutexesByKey[key]
    }
}
