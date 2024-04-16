import { ObjectId } from 'mongodb'

export default function generateId() {
    return new ObjectId().toString()
}
