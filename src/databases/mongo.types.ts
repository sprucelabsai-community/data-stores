/// <reference types="node" />
/// <reference lib="esnext.asynciterable" />

import { checkServerIdentity } from 'tls'
import {
    Binary,
    Decimal128,
    Double,
    Int32,
    Long,
    ObjectId,
    Timestamp,
} from 'bson'
import { BSONType, ResumeToken } from 'mongodb'
import { AggregationCursor, Code } from 'mongodb'
import { ClientSession, MongoClient, MongoError, ReadPreference } from 'mongodb'

type Cursor<A = any> = A extends true ? any : any
type CommandCursor = any

type FlattenIfArray<T> = T extends readonly (infer R)[] ? R : T
export type WithoutProjection<T> = T & {
    fields?: undefined
    projection?: undefined
}

export {
    Binary,
    DBRef,
    Decimal128,
    Double,
    Int32,
    Long,
    MaxKey,
    MinKey,
    ObjectId,
    Timestamp,
} from 'bson'

type NumericTypes = number | Decimal128 | Double | Int32 | Long

export type ClientSessionId = unknown

/**
 * The MongoDB ReadConcern, which allows for control of the consistency and isolation properties
 * of the data read from replica sets and replica set shards.
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#ReadConcern
 */
type ReadConcernLevel =
    | 'local'
    | 'available'
    | 'majority'
    | 'linearizable'
    | 'snapshot'

/**
 * The MongoDB ReadConcern, which allows for control of the consistency and isolation properties
 * of the data read from replica sets and replica set shards.
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#ReadConcern
 */
export interface ReadConcern {
    level: ReadConcernLevel
}

/**
 * A MongoDB WriteConcern, which describes the level of acknowledgement
 * requested from MongoDB for write operations.
 *
 * @param w requests acknowledgement that the write operation has propagated to a specified number of mongod hosts
 * @param j requests acknowledgement from MongoDB that the write operation has been written to the journal
 * @param timeout a time limit, in milliseconds, for the write concern
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#WriteConcern
 */
interface WriteConcern {
    /**
     * Requests acknowledgement that the write operation has
     * propagated to a specified number of mongod hosts
     * @default 1
     */
    w?: number | 'majority' | string | undefined
    /**
     * Requests acknowledgement from MongoDB that the write operation has
     * been written to the journal
     * @default false
     */
    j?: boolean | undefined
    /**
     * A time limit, in milliseconds, for the write concern
     */
    wtimeout?: number | undefined
}

/**
 * Options to pass when creating a Client Session
 *
 * @param causalConsistency Whether causal consistency should be enabled on this session
 * @param defaultTransactionOptions The default TransactionOptions to use for transactions started on this session.
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#SessionOptions
 */
export interface SessionOptions {
    /**
     * Whether causal consistency should be enabled on this session
     * @default true
     */
    causalConsistency?: boolean | undefined
    /**
     * The default TransactionOptions to use for transactions started on this session.
     */
    defaultTransactionOptions?: TransactionOptions | undefined
}

/**
 * Configuration options for a transaction.
 *
 * @param readConcern A default read concern for commands in this transaction
 * @param writeConcern A default writeConcern for commands in this transaction
 * @param readPreference A default read preference for commands in this transaction
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#TransactionOptions
 */
export interface TransactionOptions {
    readConcern?: ReadConcern | undefined
    writeConcern?: WriteConcern | undefined
    readPreference?: ReadPreferenceOrMode | undefined
}

/**
 * @param noListener Do not make the db an event listener to the original connection.
 * @param returnNonCachedInstance Control if you want to return a cached instance or have a new one created
 */
export interface MongoClientCommonOption {
    noListener?: boolean | undefined
    returnNonCachedInstance?: boolean | undefined
}

/**
 * The callback format for results
 *
 * @param error An error instance representing the error during the execution.
 * @param result The result object if the command was executed successfully.
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#~resultCallback
 */
export type MongoCallback<T> = (error: MongoError, result: T) => void

/**
 * A user provided function to be run within a transaction
 *
 * @param session The parent session of the transaction running the operation. This should be passed into each operation within the lambda.
 * @returns Resulting Promise of operations run within this transaction
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#WithTransactionCallback
 */
export type WithTransactionCallback = (session: ClientSession) => Promise<void>

/**
 * Optional settings for MongoClient.connect()
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html#.connect
 */
export interface MongoClientOptions
    extends
        DbCreateOptions,
        ServerOptions,
        MongosOptions,
        ReplSetOptions,
        SocketOptions,
        SSLOptions,
        TLSOptions,
        HighAvailabilityOptions,
        UnifiedTopologyOptions {
    /**
     * The logging level (error/warn/info/debug)
     */
    loggerLevel?: string | undefined

    /**
     * Custom logger object
     */
    logger?: object | Log | undefined

    /**
     * Validate MongoClient passed in options for correctness
     * @default false
     */
    validateOptions?: object | boolean | undefined

    /**
     * The name of the application that created this MongoClient instance.
     */
    appname?: string | undefined

    /**
     * Authentication credentials
     */
    auth?:
        | {
              /**
               * The username for auth
               */
              user: string
              /**
               * The password for auth
               */
              password: string
          }
        | undefined

    /**
     * Determines whether or not to use the new url parser. Enables the new, spec-compliant
     * url parser shipped in the core driver. This url parser fixes a number of problems with
     * the original parser, and aims to outright replace that parser in the near future.
     * @default true
     */
    useNewUrlParser?: boolean | undefined

    /**
     * Number of retries for a tailable cursor
     * @default 5
     */
    numberOfRetries?: number | undefined

    /**
     * An authentication mechanism to use for connection authentication,
     * see the {@link https://docs.mongodb.com/v3.6/reference/connection-string/#urioption.authMechanism authMechanism}
     * reference for supported options.
     */
    authMechanism?:
        | 'DEFAULT'
        | 'GSSAPI'
        | 'PLAIN'
        | 'MONGODB-X509'
        | 'MONGODB-CR'
        | 'MONGODB-AWS'
        | 'SCRAM-SHA-1'
        | 'SCRAM-SHA-256'
        | string
        | undefined

    /** Type of compression to use */
    compression?:
        | {
              /** The selected compressors in preference order */
              compressors?: ('snappy' | 'zlib')[] | undefined
          }
        | undefined

    /**
     * Enable directConnection
     * @default false
     */
    directConnection?: boolean | undefined

    /*
     * Optionally enable client side auto encryption.
     */
    autoEncryption?: AutoEncryptionOptions | undefined
}

/**
 * Extra options related to the mongocryptd process.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/AutoEncrypter.html#~AutoEncryptionExtraOptions
 */
export interface AutoEncryptionExtraOptions {
    /**
     * A local process the driver communicates with to determine how to encrypt
     * values in a command. Defaults to "mongodb:///var/mongocryptd.sock" if
     * domain sockets are available or "mongodb://localhost:27020" otherwise.
     */
    mongocryptdURI?: string | undefined

    /**
     * If true, autoEncryption will not attempt to spawn a mongocryptd before
     * connecting.
     */
    mongocryptdBypassSpawn?: boolean | undefined

    /**
     * The path to the mongocryptd executable on the system.
     */
    mongocryptdSpawnPath?: string | undefined

    /**
     * Command line arguments to use when auto-spawning a mongocryptd.
     */
    mongocryptdSpawnArgs?: string[] | undefined
}

/**
 * Configuration options that are used by specific KMS providers during key
 * generation, encryption, and decryption.
 *
 * @see http://mongodb.github.io/node-mongodb-native/3.6/api/global.html#KMSProviders
 */
export interface KMSProviders {
    /**
     * Configuration options for using 'aws' as your KMS provider.
     */
    aws?:
        | {
              /**
               * The access key used for the AWS KMS provider.
               */
              accessKeyId?: string | undefined

              /**
               * The secret access key used for the AWS KMS provider.
               */
              secretAccessKey?: string | undefined
          }
        | undefined

    /**
     * Configuration options for using `gcp` as your KMS provider.
     */
    gcp?:
        | {
              /**
               * The service account email to authenticate.
               */
              email?: string | undefined

              /**
               * A PKCS#8 encrypted key. This can either be a base64 string or a
               * binary representation.
               */
              privateKey?: string | Buffer | undefined

              /**
               * If present, a host with optional port. E.g. "example.com" or
               * "example.com:443". Defaults to "oauth2.googleapis.com".
               */
              endpoint?: string | undefined
          }
        | undefined

    /**
     * Configuration options for using 'local' as your KMS provider.
     */
    local?:
        | {
              /**
               * The master key used to encrypt/decrypt data keys. A 96-byte long
               * Buffer.
               */
              key?: Buffer | undefined
          }
        | undefined
}

/**
 * Configuration options for a automatic client encryption.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/AutoEncrypter.html#~AutoEncryptionOptions
 */
export interface AutoEncryptionOptions {
    /**
     * A MongoClient used to fetch keys from a key vault
     */
    keyVaultClient?: MongoClient | undefined

    /**
     * The namespace where keys are stored in the key vault.
     */
    keyVaultNamespace?: string | undefined

    /**
     * Configuration options that are used by specific KMS providers during key
     * generation, encryption, and decryption.
     */
    kmsProviders?: KMSProviders | undefined

    /**
     * A map of namespaces to a local JSON schema for encryption.
     */
    schemaMap?: object | undefined

    /**
     * Allows the user to bypass auto encryption, maintaining implicit
     * decryption.
     */
    bypassAutoEncryption?: boolean | undefined

    /**
     * Extra options related to the mongocryptd process.
     */
    extraOptions?: AutoEncryptionExtraOptions | undefined
}

export interface SSLOptions {
    /**
     * Passed directly through to tls.createSecureContext.
     *
     * @see https://nodejs.org/dist/latest/docs/api/tls.html#tls_tls_createsecurecontext_options
     */
    ciphers?: string | undefined
    /**
     * Passed directly through to tls.createSecureContext.
     *
     * @see https://nodejs.org/dist/latest/docs/api/tls.html#tls_tls_createsecurecontext_options
     */
    ecdhCurve?: string | undefined
    /**
     * Number of connections for each server instance; set to 5 as default for legacy reasons
     * @default 5
     */
    poolSize?: number | undefined
    /**
     * If present, the connection pool will be initialized with minSize connections, and will never dip below minSize connections
     */
    minSize?: number | undefined
    /**
     * Use ssl connection (needs to have a mongod server with ssl support)
     */
    ssl?: boolean | undefined
    /**
     * Validate mongod server certificate against ca (mongod server >=2.4 with ssl support required)
     * @default true
     */
    sslValidate?: boolean | undefined
    /**
     * Server identity checking during SSL
     * @default true
     */
    checkServerIdentity?: boolean | typeof checkServerIdentity | undefined
    /**
     * Array of valid certificates either as Buffers or Strings
     */
    sslCA?: readonly (Buffer | string)[] | undefined
    /**
     * SSL Certificate revocation list binary buffer
     */
    sslCRL?: readonly (Buffer | string)[] | undefined
    /**
     * SSL Certificate binary buffer
     */
    sslCert?: Buffer | string | undefined
    /**
     * SSL Key file binary buffer
     */
    sslKey?: Buffer | string | undefined
    /**
     * SSL Certificate pass phrase
     */
    sslPass?: Buffer | string | undefined
    /**
     * String containing the server name requested via TLS SNI.
     */
    servername?: string | undefined
}

export interface TLSOptions {
    /**
     * Enable TLS connections
     * @default false
     */
    tls?: boolean | undefined
    /**
     * Relax TLS constraints, disabling validation
     * @default false
     */
    tlsInsecure?: boolean | undefined
    /**
     * Path to file with either a single or bundle of certificate authorities
     * to be considered trusted when making a TLS connection
     */
    tlsCAFile?: string | undefined
    /**
     * Path to the client certificate file or the client private key file;
     * in the case that they both are needed, the files should be concatenated
     */
    tlsCertificateKeyFile?: string | undefined
    /**
     * The password to decrypt the client private key to be used for TLS connections
     */
    tlsCertificateKeyFilePassword?: string | undefined
    /**
     * Specifies whether or not the driver should error when the server’s TLS certificate is invalid
     */
    tlsAllowInvalidCertificates?: boolean | undefined
    /**
     * Specifies whether or not the driver should error when there is a mismatch between the server’s hostname
     * and the hostname specified by the TLS certificate
     */
    tlsAllowInvalidHostnames?: boolean | undefined
}

export interface HighAvailabilityOptions {
    /**
     * Turn on high availability monitoring
     * @default true
     */
    ha?: boolean | undefined
    /**
     * The High availability period for replicaset inquiry
     * @default 10000
     */
    haInterval?: number | undefined
    /**
     * @default false
     */
    domainsEnabled?: boolean | undefined

    /**
     * The ReadPreference mode as listed
     * {@link https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html here}
     */
    readPreference?: ReadPreferenceOrMode | undefined
    /**
     * An object representing read preference tags
     * @see https://docs.mongodb.com/v3.6/core/read-preference-tags/
     */
    readPreferenceTags?: ReadPreferenceTags | undefined
}

export type ReadPreferenceTags = readonly Record<string, string>[]
export type ReadPreferenceMode =
    | 'primary'
    | 'primaryPreferred'
    | 'secondary'
    | 'secondaryPreferred'
    | 'nearest'
export type ReadPreferenceOrMode = ReadPreference | ReadPreferenceMode
export interface ReadPreferenceOptions {
    /** Server mode in which the same query is dispatched in parallel to multiple replica set members. */
    hedge?:
        | {
              /** Explicitly enable or disable hedged reads. */
              enabled?: boolean | undefined
          }
        | undefined
    /**
     * Max secondary read staleness in seconds, Minimum value is 90 seconds.
     */
    maxStalenessSeconds?: number | undefined
}

/**
 * Optional settings for creating a new Db instance
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html
 */
export interface DbCreateOptions extends CommonOptions {
    /**
     * If the database authentication is dependent on another databaseName.
     */
    authSource?: string | undefined
    /**
     * Force server to assign `_id` fields instead of driver
     * @default false
     */
    forceServerObjectId?: boolean | undefined
    /**
     * Use c++ bson parser
     * @default false
     */
    native_parser?: boolean | undefined
    /**
     * Serialize functions on any object
     * @default false
     */
    serializeFunctions?: boolean | undefined
    /**
     * Specify if the BSON serializer should ignore undefined fields
     * @default false
     */
    ignoreUndefined?: boolean | undefined
    /**
     * Return document results as raw BSON buffers
     * @default false
     */
    raw?: boolean | undefined
    /**
     * Promotes Long values to number if they fit inside the 53 bits resolution
     * @default true
     */
    promoteLongs?: boolean | undefined
    /**
     * Promotes Binary BSON values to native Node Buffers
     * @default false
     */
    promoteBuffers?: boolean | undefined
    /**
     * Promotes BSON values to native types where possible, set to false to only receive wrapper types
     * @default true
     */
    promoteValues?: boolean | undefined
    /**
     * The preferred read preference. Use {@link ReadPreference} class.
     */
    readPreference?: ReadPreferenceOrMode | undefined
    /**
     * A primary key factory object for generation of custom `_id` keys.
     */
    pkFactory?: object | undefined
    /**
     * A Promise library class the application wishes to use such as Bluebird, must be ES6 compatible
     */
    promiseLibrary?: PromiseConstructor | undefined
    /**
     * @see https://docs.mongodb.com/v3.6/reference/read-concern/#read-concern
     * @since MongoDB 3.2
     */
    readConcern?: ReadConcern | string | undefined
    /**
     * Sets a cap on how many operations the driver will buffer up before giving up on getting a
     * working connection, default is -1 which is unlimited.
     */
    bufferMaxEntries?: number | undefined
}

export interface UnifiedTopologyOptions {
    /**
     * Enables the new unified topology layer
     */
    useUnifiedTopology?: boolean | undefined

    /**
     * **Only applies to the unified topology**
     * The size of the latency window for selecting among multiple suitable servers
     * @default 15
     */
    localThresholdMS?: number | undefined

    /**
     * With `useUnifiedTopology`, the MongoDB driver will try to find a server to send any given operation to
     * and keep retrying for `serverSelectionTimeoutMS` milliseconds.
     * @default 30000
     */
    serverSelectionTimeoutMS?: number | undefined

    /**
     * **Only applies to the unified topology**
     * The frequency with which topology updates are scheduled
     * @default 10000
     */
    heartbeatFrequencyMS?: number | undefined

    /**
     *  **Only applies to the unified topology**
     * The maximum number of connections that may be associated with a pool at a given time
     * This includes in use and available connections
     * @default 10
     */
    maxPoolSize?: number | undefined

    /**
     * **Only applies to the unified topology**
     * The minimum number of connections that MUST exist at any moment in a single connection pool
     * @default 0
     */
    minPoolSize?: number | undefined

    /**
     * **Only applies to the unified topology**
     * The maximum amount of time a connection should remain idle in the connection pool before being marked idle
     * @default Infinity
     */
    maxIdleTimeMS?: number | undefined

    /**
     * **Only applies to the unified topology**
     * The maximum amount of time operation execution should wait for a connection to become available.
     * The default is 0 which means there is no limit.
     * @default 0
     */
    waitQueueTimeoutMS?: number | undefined
}

/**
 * Optional socket options
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Server.html
 */
export interface SocketOptions {
    /**
     * Reconnect on error
     * @default true
     */
    autoReconnect?: boolean | undefined
    /**
     * TCP Socket NoDelay option
     * @default true
     */
    noDelay?: boolean | undefined
    /**
     * TCP KeepAlive enabled on the socket
     * @default true
     */
    keepAlive?: boolean | undefined
    /**
     * TCP KeepAlive initial delay before sending first keep-alive packet when idle
     * @default 30000
     */
    keepAliveInitialDelay?: number | undefined
    /**
     * TCP Connection timeout setting
     * @default 10000
     */
    connectTimeoutMS?: number | undefined
    /**
     * Version of IP stack. Can be 4, 6 or null
     * @default null
     *
     * If null, will attempt to connect with IPv6, and will fall back to IPv4 on failure
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html
     */
    family?: 4 | 6 | null | undefined
    /**
     * TCP Socket timeout setting
     * @default 360000
     */
    socketTimeoutMS?: number | undefined
}

/**
 * Optional settings for creating a new Server instance
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Server.html
 */
export interface ServerOptions extends SSLOptions {
    /**
     * If you're connected to a single server or mongos proxy (as opposed to a replica set),
     * the MongoDB driver will try to reconnect every reconnectInterval milliseconds for reconnectTries
     * times, and give up afterward. When the driver gives up, the mongoose connection emits a
     * reconnectFailed event.
     * @default 30
     */
    reconnectTries?: number | undefined
    /**
     * Will wait # milliseconds between retries
     * @default 1000
     */
    reconnectInterval?: number | undefined
    /**
     * @default true
     */
    monitoring?: boolean | undefined

    /**
     * Enable command monitoring for this client
     * @default false
     */
    monitorCommands?: boolean | undefined

    /**
     * Socket Options
     */
    socketOptions?: SocketOptions | undefined

    /**
     * The High availability period for replicaset inquiry
     * @default 10000
     */
    haInterval?: number | undefined
    /**
     * @default false
     */
    domainsEnabled?: boolean | undefined

    /**
     * Specify a file sync write concern
     * @default false
     */
    fsync?: boolean | undefined
}

/**
 * Optional settings for creating a new Mongos instance
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Mongos.html
 */
export interface MongosOptions extends SSLOptions, HighAvailabilityOptions {
    /**
     * Cutoff latency point in MS for MongoS proxy selection
     * @default 15
     */
    acceptableLatencyMS?: number | undefined

    /**
     * Socket Options
     */
    socketOptions?: SocketOptions | undefined
}

/**
 * Optional settings for creating a new ReplSet instance
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/ReplSet.html
 */
export interface ReplSetOptions extends SSLOptions, HighAvailabilityOptions {
    /**
     * The max staleness to secondary reads (values under 10 seconds cannot be guaranteed);
     */
    maxStalenessSeconds?: number | undefined
    /**
     * The name of the replicaset to connect to.
     */
    replicaSet?: string | undefined
    /**
     * Range of servers to pick when using NEAREST (lowest ping ms + the latency fence, ex: range of 1 to (1 + 15) ms)
     * @default 15
     */
    secondaryAcceptableLatencyMS?: number | undefined
    /**
     * If the driver should connect even if no primary is available
     * @default false
     */
    connectWithNoPrimary?: boolean | undefined
    /**
     * Optional socket options
     *
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Server.html
     */
    socketOptions?: SocketOptions | undefined
}

export type ProfilingLevel = 'off' | 'slow_only' | 'all'

export interface CommonOptions extends WriteConcern {
    session?: ClientSession | undefined
    writeConcern?: WriteConcern | string | undefined
}

/**
 * Optional settings for adding a user to the database
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html#addUser
 */
export interface DbAddUserOptions extends CommonOptions {
    customData?: object | undefined
    roles?: object[] | undefined
}

/**
 * Options for creating a new collection on a server
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html#createCollection
 */
export interface CollectionCreateOptions extends CommonOptions {
    raw?: boolean | undefined
    pkFactory?: object | undefined
    readPreference?: ReadPreferenceOrMode | undefined
    serializeFunctions?: boolean | undefined
    /**
     * @deprecated
     * @see https://jira.mongodb.org/browse/NODE-2746
     */
    strict?: boolean | undefined
    capped?: boolean | undefined
    /**
     * @deprecated
     */
    autoIndexId?: boolean | undefined
    size?: number | undefined
    max?: number | undefined
    flags?: number | undefined
    storageEngine?: object | undefined
    validator?: object | undefined
    validationLevel?: 'off' | 'strict' | 'moderate' | undefined
    validationAction?: 'error' | 'warn' | undefined
    indexOptionDefaults?: object | undefined
    viewOn?: string | undefined
    pipeline?: any[] | undefined
    collation?: CollationDocument | undefined
}

/**
 * Options for fetching a specific collection.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html#collection
 */
export interface DbCollectionOptions extends CommonOptions {
    raw?: boolean | undefined
    pkFactory?: object | undefined
    readPreference?: ReadPreferenceOrMode | undefined
    serializeFunctions?: boolean | undefined
    strict?: boolean | undefined
    readConcern?: ReadConcern | undefined
}

/**
 * Options for creating an index on the db and collection.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html#createIndex
 */
export interface IndexOptions extends CommonOptions {
    /**
     * Creates an unique index.
     */
    unique?: boolean | undefined
    /**
     * Creates a sparse index.
     */
    sparse?: boolean | undefined
    /**
     * Creates the index in the background, yielding whenever possible.
     */
    background?: boolean | undefined
    /**
     * A unique index cannot be created on a key that has pre-existing duplicate values.
     *
     * If you would like to create the index anyway, keeping the first document the database indexes and
     * deleting all subsequent documents that have duplicate value
     */
    dropDups?: boolean | undefined
    /**
     * For geo spatial indexes set the lower bound for the co-ordinates.
     */
    min?: number | undefined
    /**
     * For geo spatial indexes set the high bound for the co-ordinates.
     */
    max?: number | undefined
    /**
     * Specify the format version of the indexes.
     */
    v?: number | undefined
    /**
     * Allows you to expire data on indexes applied to a data (MongoDB 2.2 or higher)
     */
    expireAfterSeconds?: number | undefined
    /**
     * Override the auto generated index name (useful if the resulting name is larger than 128 bytes)
     */
    name?: string | undefined
    /**
     * Creates a partial index based on the given filter object (MongoDB 3.2 or higher)
     */
    partialFilterExpression?: any
    collation?: CollationDocument | undefined
    default_language?: string | undefined
}

/**
 * Create a new Admin instance (INTERNAL TYPE, do not instantiate directly)
 *
 * @returns Collection instance
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html
 */
export interface Admin {
    /**
     * Add a user to the database.
     *
     * @param username The username
     * @param password The password
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#addUser
     */
    addUser(
        username: string,
        password: string,
        callback: MongoCallback<any>
    ): void
    addUser(
        username: string,
        password: string,
        options?: AddUserOptions
    ): Promise<any>
    addUser(
        username: string,
        password: string,
        options: AddUserOptions,
        callback: MongoCallback<any>
    ): void
    /**
     * Retrieve the server information for the current instance of the db client
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#buildInfo
     */
    buildInfo(options?: { session?: ClientSession | undefined }): Promise<any>
    buildInfo(
        options: { session?: ClientSession | undefined },
        callback: MongoCallback<any>
    ): void
    buildInfo(callback: MongoCallback<any>): void
    /**
     * Execute a command
     *
     * @param command The command hash
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#command
     */
    command(command: object, callback: MongoCallback<any>): void
    command(
        command: object,
        options?: {
            readPreference?: ReadPreferenceOrMode | undefined
            maxTimeMS?: number | undefined
        }
    ): Promise<any>
    command(
        command: object,
        options: {
            readPreference?: ReadPreferenceOrMode | undefined
            maxTimeMS?: number | undefined
        },
        callback: MongoCallback<any>
    ): void
    /**
     * List the available databases
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#listDatabases
     */
    listDatabases(options?: {
        nameOnly?: boolean | undefined
        session?: ClientSession | undefined
    }): Promise<any>
    listDatabases(
        options: {
            nameOnly?: boolean | undefined
            session?: ClientSession | undefined
        },
        callback: MongoCallback<any>
    ): void
    listDatabases(callback: MongoCallback<any>): void
    /**
     * Ping the MongoDB server and retrieve results
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#ping
     */
    ping(options?: { session?: ClientSession | undefined }): Promise<any>
    ping(
        options: { session?: ClientSession | undefined },
        callback: MongoCallback<any>
    ): void
    ping(callback: MongoCallback<any>): void
    /**
     * Remove a user from a database
     *
     * @param username The username
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#removeUser
     */
    removeUser(username: string, callback: MongoCallback<any>): void
    removeUser(username: string, options?: FSyncOptions): Promise<any>
    removeUser(
        username: string,
        options: FSyncOptions,
        callback: MongoCallback<any>
    ): void
    /**
     * Get ReplicaSet status
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#replSetGetStatus
     */
    replSetGetStatus(options?: {
        session?: ClientSession | undefined
    }): Promise<any>
    replSetGetStatus(
        options: { session?: ClientSession | undefined },
        callback: MongoCallback<any>
    ): void
    replSetGetStatus(callback: MongoCallback<any>): void
    /**
     * Retrieve the server information for the current instance of the db client
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#serverInfo
     */
    serverInfo(): Promise<any>
    serverInfo(callback: MongoCallback<any>): void
    /**
     * Retrieve this db's server status.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#serverStatus
     */
    serverStatus(options?: {
        session?: ClientSession | undefined
    }): Promise<any>
    serverStatus(
        options: { session?: ClientSession | undefined },
        callback: MongoCallback<any>
    ): void
    serverStatus(callback: MongoCallback<any>): void
    /**
     * Validate an existing collection
     *
     * @param collectionNme The name of the collection to validate
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#validateCollection
     */
    validateCollection(
        collectionNme: string,
        callback: MongoCallback<any>
    ): void
    validateCollection(collectionNme: string, options?: object): Promise<any>
    validateCollection(
        collectionNme: string,
        options: object,
        callback: MongoCallback<any>
    ): void
}

/**
 * Options for adding a user to the database
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#addUser
 */
export interface AddUserOptions extends CommonOptions {
    fsync: boolean
    customData?: object | undefined
    roles?: object[] | undefined
}

/**
 * Options for removing a user from the database
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Admin.html#removeUser
 */
export interface FSyncOptions extends CommonOptions {
    fsync?: boolean | undefined
}

// TypeScript Omit (Exclude to be specific) does not work for objects with an "any" indexed type, and breaks discriminated unions
type EnhancedOmit<T, K> = string | number extends keyof T
    ? T // T has indexed type e.g. { _id: string; [k: string]: any; } or it is "any"
    : T extends any
      ? Pick<T, Exclude<keyof T, K>> // discriminated unions
      : never

type ExtractIdType<TSchema> = TSchema extends { _id: infer U } // user has defined a type for _id
    ? {} extends U
        ? Exclude<U, {}>
        : unknown extends U
          ? ObjectId
          : U
    : ObjectId // user has not defined _id on schema

// this makes _id optional
export type OptionalId<TSchema extends { _id?: any }> =
    ObjectId extends TSchema['_id']
        ? // a Schema with ObjectId _id type or "any" or "indexed type" provided
          EnhancedOmit<TSchema, '_id'> & {
              _id?: ExtractIdType<TSchema> | undefined
          }
        : // a Schema provided but _id type is not ObjectId
          WithId<TSchema>

// this adds _id as a required property
export type WithId<TSchema> = EnhancedOmit<TSchema, '_id'> & {
    _id: ExtractIdType<TSchema>
}

/**
 * Create a new Collection instance (INTERNAL TYPE, do not instantiate directly)
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html
 */
export interface Collection<
    TSchema extends Record<string, any> = DefaultSchema,
> {
    /**
     * Get the collection name.
     */
    collectionName: string
    /**
     * Get the full collection namespace.
     */
    namespace: string
    /**
     * The current write concern values.
     */
    writeConcern: WriteConcern
    /**
     * The current read concern values.
     */
    readConcern: ReadConcern
    /**
     * Get current index hint for collection.
     */
    hint: any
    /**
     * Execute an aggregation framework pipeline against the collection, needs MongoDB >= 2.2
     *
     * @param pipeline Array containing all the aggregation framework commands for the execution
     * @param options Optional settings
     * @param callback The command result callback
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#aggregate
     */
    aggregate<T = TSchema>(
        callback: MongoCallback<AggregationCursor<T>>
    ): AggregationCursor<T>
    aggregate<T = TSchema>(
        pipeline: object[],
        callback: MongoCallback<AggregationCursor<T>>
    ): AggregationCursor<T>
    aggregate<T = TSchema>(
        pipeline?: object[],
        options?: CollectionAggregationOptions,
        callback?: MongoCallback<AggregationCursor<T>>
    ): AggregationCursor<T>
    /**
     * Perform a bulkWrite operation without a fluent API
     * If documents passed in do not contain the **_id** field,
     * one will be added to each of the documents missing it by the driver, mutating the document. This behavior
     * can be overridden by setting the **forceServerObjectId** flag.
     *
     * @param operations Bulk operations to perform
     * @param options Optional settings
     * @param callback The command result callback
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#bulkWrite
     */
    bulkWrite(
        operations: BulkWriteOperation<TSchema>[],
        callback: MongoCallback<BulkWriteOpResultObject>
    ): void
    bulkWrite(
        operations: BulkWriteOperation<TSchema>[],
        options?: CollectionBulkWriteOptions
    ): Promise<BulkWriteOpResultObject>
    bulkWrite(
        operations: BulkWriteOperation<TSchema>[],
        options: CollectionBulkWriteOptions,
        callback: MongoCallback<BulkWriteOpResultObject>
    ): void
    /**
     * An estimated count of matching documents in the db to a query.
     *
     * @param query The query for the count
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#count
     * @deprecated Use `countDocuments` or `estimatedDocumentCount`
     */
    count(callback: MongoCallback<number>): void
    count(query: FilterQuery<TSchema>, callback: MongoCallback<number>): void
    count(
        query?: FilterQuery<TSchema>,
        options?: MongoCountPreferences
    ): Promise<number>
    count(
        query: FilterQuery<TSchema>,
        options: MongoCountPreferences,
        callback: MongoCallback<number>
    ): void
    /**
     * Gets the number of documents matching the filter
     * For a fast count of the total documents in a collection see `estimatedDocumentCount`.
     *
     * @param query The query for the count
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#countDocuments
     */
    countDocuments(callback: MongoCallback<number>): void
    countDocuments(
        query: FilterQuery<TSchema>,
        callback: MongoCallback<number>
    ): void
    countDocuments(
        query?: FilterQuery<TSchema>,
        options?: MongoCountPreferences
    ): Promise<number>
    countDocuments(
        query: FilterQuery<TSchema>,
        options: MongoCountPreferences,
        callback: MongoCallback<number>
    ): void
    /**
     * Creates an index on the db and collection collection.
     *
     * @param fieldOrSpec Defines the index
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#createIndex
     */
    createIndex(
        fieldOrSpec: string | any,
        callback: MongoCallback<string>
    ): void
    createIndex(
        fieldOrSpec: string | any,
        options?: IndexOptions
    ): Promise<string>
    createIndex(
        fieldOrSpec: string | any,
        options: IndexOptions,
        callback: MongoCallback<string>
    ): void
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * **Note:** Unlike `createIndex`, this function takes in raw index specifications.
     * Index specifications are defined {@link http://docs.mongodb.org/manual/reference/command/createIndexes/ here}.
     *
     * @param indexSpecs An array of index specifications to be created
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#createIndexes
     */
    createIndexes(
        indexSpecs: IndexSpecification[],
        callback: MongoCallback<any>
    ): void
    createIndexes(
        indexSpecs: IndexSpecification[],
        options?: { session?: ClientSession | undefined }
    ): Promise<any>
    createIndexes(
        indexSpecs: IndexSpecification[],
        options: { session?: ClientSession | undefined },
        callback: MongoCallback<any>
    ): void
    /**
     * Delete multiple documents from a collection
     *
     * @param filter The Filter used to select the documents to remove
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#deleteMany
     */
    deleteMany(
        filter: FilterQuery<TSchema>,
        callback: MongoCallback<DeleteWriteOpResultObject>
    ): void
    deleteMany(
        filter: FilterQuery<TSchema>,
        options?: CommonOptions
    ): Promise<DeleteWriteOpResultObject>
    deleteMany(
        filter: FilterQuery<TSchema>,
        options: CommonOptions,
        callback: MongoCallback<DeleteWriteOpResultObject>
    ): void
    /**
     * Delete a document from a collection
     *
     * @param filter The Filter used to select the document to remove
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#deleteOne
     */
    deleteOne(
        filter: FilterQuery<TSchema>,
        callback: MongoCallback<DeleteWriteOpResultObject>
    ): void
    deleteOne(
        filter: FilterQuery<TSchema>,
        options?: CommonOptions & {
            bypassDocumentValidation?: boolean | undefined
        }
    ): Promise<DeleteWriteOpResultObject>
    deleteOne(
        filter: FilterQuery<TSchema>,
        options: CommonOptions & {
            bypassDocumentValidation?: boolean | undefined
        },
        callback: MongoCallback<DeleteWriteOpResultObject>
    ): void
    /**
     * The distinct command returns a list of distinct values for the given key across a collection.
     *
     * @param key Field of the document to find distinct values for.
     * @param query The optional query for filtering the set of documents to which we apply the distinct filter.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#distinct
     */
    distinct<Key extends keyof WithId<TSchema>>(
        key: Key,
        callback: MongoCallback<
            FlattenIfArray<WithId<Required<TSchema>>[Key]>[]
        >
    ): void
    distinct<Key extends keyof WithId<TSchema>>(
        key: Key,
        query: FilterQuery<TSchema>,
        callback: MongoCallback<
            FlattenIfArray<WithId<Required<TSchema>>[Key]>[]
        >
    ): void
    distinct<Key extends keyof WithId<TSchema>>(
        key: Key,
        query?: FilterQuery<TSchema>,
        options?: MongoDistinctPreferences
    ): Promise<FlattenIfArray<WithId<Required<TSchema>>[Key]>[]>
    distinct<Key extends keyof WithId<TSchema>>(
        key: Key,
        query: FilterQuery<TSchema>,
        options: MongoDistinctPreferences,
        callback: MongoCallback<
            FlattenIfArray<WithId<Required<TSchema>>[Key]>[]
        >
    ): void
    distinct(key: string, callback: MongoCallback<any[]>): void
    distinct(
        key: string,
        query: FilterQuery<TSchema>,
        callback: MongoCallback<any[]>
    ): void
    distinct(
        key: string,
        query?: FilterQuery<TSchema>,
        options?: MongoDistinctPreferences
    ): Promise<any[]>
    distinct(
        key: string,
        query: FilterQuery<TSchema>,
        options: MongoDistinctPreferences,
        callback: MongoCallback<any[]>
    ): void
    /**
     * Drop the collection from the database, removing it permanently. New accesses will create a new collection.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#drop
     */
    drop(options?: { session: ClientSession }): Promise<any>
    drop(callback: MongoCallback<any>): void
    drop(
        options: { session: ClientSession },
        callback: MongoCallback<any>
    ): void
    /**
     * Drops an index from this collection.
     *
     * @param indexName Name of the index to drop.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#dropIndex
     */
    dropIndex(indexName: string, callback: MongoCallback<any>): void
    dropIndex(
        indexName: string,
        options?: CommonOptions & { maxTimeMS?: number | undefined }
    ): Promise<any>
    dropIndex(
        indexName: string,
        options: CommonOptions & { maxTimeMS?: number | undefined },
        callback: MongoCallback<any>
    ): void
    /**
     * Drops all indexes from this collection.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#dropIndexes
     */
    dropIndexes(options?: {
        session?: ClientSession | undefined
        maxTimeMS?: number | undefined
    }): Promise<any>
    dropIndexes(callback?: MongoCallback<any>): void
    dropIndexes(
        options: {
            session?: ClientSession | undefined
            maxTimeMS?: number | undefined
        },
        callback: MongoCallback<any>
    ): void
    /**
     * Gets an estimate of the count of documents in a collection using collection metadata.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#estimatedDocumentCount
     */
    estimatedDocumentCount(callback: MongoCallback<number>): void
    estimatedDocumentCount(
        query: FilterQuery<TSchema>,
        callback: MongoCallback<number>
    ): void
    estimatedDocumentCount(
        query?: FilterQuery<TSchema>,
        options?: MongoCountPreferences
    ): Promise<number>
    estimatedDocumentCount(
        query: FilterQuery<TSchema>,
        options: MongoCountPreferences,
        callback: MongoCallback<number>
    ): void
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB
     *
     * @param query The cursor query object
     * @param options Optional settings
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#find
     */
    find(query?: FilterQuery<TSchema>): Cursor<TSchema>
    find(
        query: FilterQuery<TSchema>,
        options?: WithoutProjection<FindOneOptions<TSchema>>
    ): Cursor<TSchema>
    find<T = TSchema>(
        query: FilterQuery<TSchema>,
        options: FindOneOptions<T extends TSchema ? TSchema : T>
    ): Cursor<T>
    /**
     * Fetches the first document that matches the query
     *
     * @param query Query for find Operation
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOne
     */
    findOne(
        filter: FilterQuery<TSchema>,
        callback: MongoCallback<TSchema>
    ): void
    findOne(
        filter: FilterQuery<TSchema>,
        options?: WithoutProjection<FindOneOptions<TSchema>>
    ): Promise<TSchema | null>
    findOne<T = TSchema>(
        filter: FilterQuery<TSchema>,
        options?: FindOneOptions<T extends TSchema ? TSchema : T>
    ): Promise<T | null>
    findOne(
        filter: FilterQuery<TSchema>,
        options: WithoutProjection<FindOneOptions<TSchema>>,
        callback: MongoCallback<TSchema | null>
    ): void
    findOne<T = TSchema>(
        filter: FilterQuery<TSchema>,
        options: FindOneOptions<T extends TSchema ? TSchema : T>,
        callback: MongoCallback<T extends TSchema ? TSchema : T | null>
    ): void
    /**
     * Find a document and delete it in one atomic operation. Requires a write lock for the duration of the operation.
     *
     * @param filter The Filter used to select the document to remove
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOneAndDelete
     */
    findOneAndDelete(
        filter: FilterQuery<TSchema>,
        callback: MongoCallback<FindAndModifyWriteOpResultObject<TSchema>>
    ): void
    findOneAndDelete(
        filter: FilterQuery<TSchema>,
        options?: FindOneAndDeleteOption<TSchema>
    ): Promise<FindAndModifyWriteOpResultObject<TSchema>>
    findOneAndDelete(
        filter: FilterQuery<TSchema>,
        options: FindOneAndDeleteOption<TSchema>,
        callback: MongoCallback<FindAndModifyWriteOpResultObject<TSchema>>
    ): void
    /**
     * Find a document and replace it in one atomic operation. Requires a write lock for the duration of the operation.
     *
     * @param filter The Filter used to select the document to replace
     * @param replacement The Document that replaces the matching document
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOneAndReplace
     */
    findOneAndReplace(
        filter: FilterQuery<TSchema>,
        replacement: object,
        callback: MongoCallback<FindAndModifyWriteOpResultObject<TSchema>>
    ): void
    findOneAndReplace(
        filter: FilterQuery<TSchema>,
        replacement: object,
        options?: FindOneAndReplaceOption<TSchema>
    ): Promise<FindAndModifyWriteOpResultObject<TSchema>>
    findOneAndReplace(
        filter: FilterQuery<TSchema>,
        replacement: object,
        options: FindOneAndReplaceOption<TSchema>,
        callback: MongoCallback<FindAndModifyWriteOpResultObject<TSchema>>
    ): void
    /**
     * Find a document and update it in one atomic operation. Requires a write lock for the duration of the operation.
     *
     * @param filter The Filter used to select the document to update
     * @param update Update operations to be performed on the document
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOneAndUpdate
     */
    findOneAndUpdate(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | TSchema,
        callback: MongoCallback<FindAndModifyWriteOpResultObject<TSchema>>
    ): void
    findOneAndUpdate(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | TSchema,
        options?: FindOneAndUpdateOption<TSchema>
    ): Promise<FindAndModifyWriteOpResultObject<TSchema>>
    findOneAndUpdate(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | TSchema,
        options: FindOneAndUpdateOption<TSchema>,
        callback: MongoCallback<FindAndModifyWriteOpResultObject<TSchema>>
    ): void
    /**
     * Execute a geo search using a geo haystack index on a collection.
     *
     * @param x Point to search on the x axis, ensure the indexes are ordered in the same order.
     * @param y Point to search on the y axis, ensure the indexes are ordered in the same order.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#geoHaystackSearch
     * @deprecated See {@link https://docs.mongodb.com/v3.6/geospatial-queries/ geospatial queries docs} for current geospatial support
     */
    geoHaystackSearch(x: number, y: number, callback: MongoCallback<any>): void
    geoHaystackSearch(
        x: number,
        y: number,
        options?: GeoHaystackSearchOptions
    ): Promise<any>
    geoHaystackSearch(
        x: number,
        y: number,
        options: GeoHaystackSearchOptions,
        callback: MongoCallback<any>
    ): void
    /**
     * Run a group command across a collection
     *
     * @param keys An object, array or function expressing the keys to group by.
     * @param condition An optional condition that must be true for a row to be considered.
     * @param initial Initial value of the aggregation counter object.
     * @param reduce The reduce function aggregates (reduces) the objects iterated.
     * @param finalize An optional function to be run on each item in the result set just before the item is returned.
     * @param command Specify if you wish to run using the internal group command or using eval, default is true.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#group
     * @deprecated MongoDB 3.6 or higher no longer supports the group command. We recommend rewriting using the aggregation framework.
     */
    group(
        keys: object | any[] | Function | Code,
        condition: object,
        initial: object,
        reduce: Function | Code,
        finalize: Function | Code,
        command: boolean,
        callback: MongoCallback<any>
    ): void
    group(
        keys: object | any[] | Function | Code,
        condition: object,
        initial: object,
        reduce: Function | Code,
        finalize: Function | Code,
        command: boolean,
        options?: {
            readPreference?: ReadPreferenceOrMode | undefined
            session?: ClientSession | undefined
        }
    ): Promise<any>
    group(
        keys: object | any[] | Function | Code,
        condition: object,
        initial: object,
        reduce: Function | Code,
        finalize: Function | Code,
        command: boolean,
        options: {
            readPreference?: ReadPreferenceOrMode | undefined
            session?: ClientSession | undefined
        },
        callback: MongoCallback<any>
    ): void
    /**
     * Retrieve all the indexes on the collection.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#indexes
     */
    indexes(options?: { session: ClientSession }): Promise<any>
    indexes(callback: MongoCallback<any>): void
    indexes(
        options: { session?: ClientSession | undefined },
        callback: MongoCallback<any>
    ): void
    /**
     * Checks if one or more indexes exist on the collection, fails on first non-existing index
     *
     * @param indexes One or more index names to check.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#indexExists
     */
    indexExists(
        indexes: string | string[],
        callback: MongoCallback<boolean>
    ): void
    indexExists(
        indexes: string | string[],
        options?: { session: ClientSession }
    ): Promise<boolean>
    indexExists(
        indexes: string | string[],
        options: { session: ClientSession },
        callback: MongoCallback<boolean>
    ): void
    /**
     * Retrieves this collections index info.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#indexInformation
     */
    indexInformation(callback: MongoCallback<any>): void
    indexInformation(options?: {
        full: boolean
        session: ClientSession
    }): Promise<any>
    indexInformation(
        options: { full: boolean; session: ClientSession },
        callback: MongoCallback<any>
    ): void
    /**
     * Initiate an In order bulk write operation. Operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     *
     * @param options Optional settings
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#initializeOrderedBulkOp
     */
    initializeOrderedBulkOp(options?: CommonOptions): OrderedBulkOperation
    /**
     * Initiate an Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     *
     * @param options Optional settings
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#initializeUnorderedBulkOp
     */
    initializeUnorderedBulkOp(options?: CommonOptions): UnorderedBulkOperation
    /**
     * Inserts a single document or a an array of documents into MongoDB. If documents passed in do not contain the **_id** field,
     * one will be added to each of the documents missing it by the driver, mutating the document. This behavior
     * can be overridden by setting the **forceServerObjectId** flag.
     *
     * @param docs Documents to insert.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#insert
     * @deprecated Use insertOne, insertMany or bulkWrite
     */
    insert(
        docs: OptionalId<TSchema>,
        callback: MongoCallback<InsertWriteOpResult<WithId<TSchema>>>
    ): void
    insert(
        docs: OptionalId<TSchema>,
        options?: CollectionInsertOneOptions
    ): Promise<InsertWriteOpResult<WithId<TSchema>>>
    insert(
        docs: OptionalId<TSchema>,
        options: CollectionInsertOneOptions,
        callback: MongoCallback<InsertWriteOpResult<WithId<TSchema>>>
    ): void
    /**
     * Inserts an array of documents into MongoDB. If documents passed in do not contain the **_id** field,
     * one will be added to each of the documents missing it by the driver, mutating the document. This behavior
     * can be overridden by setting the **forceServerObjectId** flag.
     *
     * @param docs Documents to insert.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#insertMany
     */
    insertMany(
        docs: OptionalId<TSchema>[],
        callback: MongoCallback<InsertWriteOpResult<WithId<TSchema>>>
    ): void
    insertMany(
        docs: OptionalId<TSchema>[],
        options?: CollectionInsertManyOptions
    ): Promise<InsertWriteOpResult<WithId<TSchema>>>
    insertMany(
        docs: OptionalId<TSchema>[],
        options: CollectionInsertManyOptions,
        callback: MongoCallback<InsertWriteOpResult<WithId<TSchema>>>
    ): void
    /**
     * Inserts a single document into MongoDB. If documents passed in do not contain the **_id** field,
     * one will be added to each of the documents missing it by the driver, mutating the document. This behavior
     * can be overridden by setting the **forceServerObjectId** flag.
     *
     * @param doc Document to insert.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#insertOne
     */
    insertOne(
        docs: OptionalId<TSchema>,
        callback: MongoCallback<InsertOneWriteOpResult<WithId<TSchema>>>
    ): void
    insertOne(
        docs: OptionalId<TSchema>,
        options?: CollectionInsertOneOptions
    ): Promise<InsertOneWriteOpResult<WithId<TSchema>>>
    insertOne(
        docs: OptionalId<TSchema>,
        options: CollectionInsertOneOptions,
        callback: MongoCallback<InsertOneWriteOpResult<WithId<TSchema>>>
    ): void
    /**
     * Returns if the collection is a capped collection
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#isCapped
     */
    isCapped(options?: { session: ClientSession }): Promise<any>
    isCapped(callback: MongoCallback<any>): void
    isCapped(
        options: { session: ClientSession },
        callback: MongoCallback<any>
    ): void
    /**
     * Get the list of all indexes information for the collection.
     *
     * @param options Optional settings
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#listIndexes
     */
    listIndexes(options?: {
        batchSize?: number | undefined
        readPreference?: ReadPreferenceOrMode | undefined
        session?: ClientSession | undefined
    }): CommandCursor
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     *
     * @param map The mapping function.
     * @param reduce The reduce function.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#mapReduce
     */
    mapReduce<TKey, TValue>(
        map: CollectionMapFunction<TSchema> | string,
        reduce: CollectionReduceFunction<TKey, TValue> | string,
        callback: MongoCallback<any>
    ): void
    mapReduce<TKey, TValue>(
        map: CollectionMapFunction<TSchema> | string,
        reduce: CollectionReduceFunction<TKey, TValue> | string,
        options?: MapReduceOptions
    ): Promise<any>
    mapReduce<TKey, TValue>(
        map: CollectionMapFunction<TSchema> | string,
        reduce: CollectionReduceFunction<TKey, TValue> | string,
        options: MapReduceOptions,
        callback: MongoCallback<any>
    ): void
    /**
     * Returns the options of the collection.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#options
     */
    options(options?: { session: ClientSession }): Promise<any>
    options(callback: MongoCallback<any>): void
    options(
        options: { session: ClientSession },
        callback: MongoCallback<any>
    ): void
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection. There are
     * no ordering guarantees for returned results.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#parallelCollectionScan
     */
    parallelCollectionScan(callback: MongoCallback<Cursor<any>[]>): void
    parallelCollectionScan(
        options?: ParallelCollectionScanOptions
    ): Promise<Cursor<any>[]>
    parallelCollectionScan(
        options: ParallelCollectionScanOptions,
        callback: MongoCallback<Cursor<any>[]>
    ): void
    /**
     * Reindex all indexes on the collection
     * Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#reIndex
     * @deprecated use db.command instead
     */
    reIndex(options?: { session: ClientSession }): Promise<any>
    reIndex(callback: MongoCallback<any>): void
    reIndex(
        options: { session: ClientSession },
        callback: MongoCallback<any>
    ): void
    /**
     * Remove documents.
     *
     * @param selector The selector for the update operation.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#remove
     * @deprecated Use use deleteOne, deleteMany or bulkWrite
     */
    remove(selector: object, callback: MongoCallback<WriteOpResult>): void
    remove(
        selector: object,
        options?: CommonOptions & { single?: boolean | undefined }
    ): Promise<WriteOpResult>
    remove(
        selector: object,
        options?: CommonOptions & { single?: boolean | undefined },
        callback?: MongoCallback<WriteOpResult>
    ): void
    /**
     * Rename the collection
     *
     * @param newName New name of of the collection.
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#rename
     */
    rename(newName: string, callback: MongoCallback<Collection<TSchema>>): void
    rename(
        newName: string,
        options?: {
            dropTarget?: boolean | undefined
            session?: ClientSession | undefined
        }
    ): Promise<Collection<TSchema>>
    rename(
        newName: string,
        options: {
            dropTarget?: boolean | undefined
            session?: ClientSession | undefined
        },
        callback: MongoCallback<Collection<TSchema>>
    ): void
    /**
     * Replace a document in a collection with another document
     *
     * @param filter The Filter used to select the document to replace
     * @param doc The Document that replaces the matching document
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#replaceOne
     */
    replaceOne(
        filter: FilterQuery<TSchema>,
        doc: TSchema,
        callback: MongoCallback<ReplaceWriteOpResult>
    ): void
    replaceOne(
        filter: FilterQuery<TSchema>,
        doc: TSchema,
        options?: ReplaceOneOptions
    ): Promise<ReplaceWriteOpResult>
    replaceOne(
        filter: FilterQuery<TSchema>,
        doc: TSchema,
        options: ReplaceOneOptions,
        callback: MongoCallback<ReplaceWriteOpResult>
    ): void
    /**
     * Save a document. Simple full document replacement function. Not recommended for efficiency, use atomic
     * operators and update instead for more efficient operations.
     *
     * @param doc Document to save
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#save
     * @deprecated Use insertOne, insertMany, updateOne or updateMany
     */
    save(doc: TSchema, callback: MongoCallback<WriteOpResult>): void
    save(doc: TSchema, options?: CommonOptions): Promise<WriteOpResult>
    save(
        doc: TSchema,
        options: CommonOptions,
        callback: MongoCallback<WriteOpResult>
    ): void
    /**
     * Get all the collection statistics.
     *
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#stats
     */
    stats(callback: MongoCallback<CollStats>): void
    stats(options?: {
        scale: number
        session?: ClientSession | undefined
    }): Promise<CollStats>
    stats(
        options: { scale: number; session?: ClientSession | undefined },
        callback: MongoCallback<CollStats>
    ): void
    /**
     * Updates documents
     *
     * @param selector The selector for the update operation.
     * @param update The update operations to be applied to the documents
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#update
     * @deprecated use updateOne, updateMany or bulkWrite
     */
    update(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        callback: MongoCallback<WriteOpResult>
    ): void
    update(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options?: UpdateOneOptions & { multi?: boolean | undefined }
    ): Promise<WriteOpResult>
    update(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options: UpdateOneOptions & { multi?: boolean | undefined },
        callback: MongoCallback<WriteOpResult>
    ): void
    /**
     * Update multiple documents in a collection
     *
     * @param filter The Filter used to select the documents to update
     * @param update The update operations to be applied to the documents
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateMany
     */
    updateMany(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        callback: MongoCallback<UpdateWriteOpResult>
    ): void
    updateMany(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options?: UpdateManyOptions
    ): Promise<UpdateWriteOpResult>
    updateMany(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options: UpdateManyOptions,
        callback: MongoCallback<UpdateWriteOpResult>
    ): void
    /**
     * Update a single document in a collection
     *
     * @param filter The Filter used to select the document to update
     * @param update The update operations to be applied to the document
     * @param options Optional settings
     * @param callback The command result callback
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateOne
     */
    updateOne(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        callback: MongoCallback<UpdateWriteOpResult>
    ): void
    updateOne(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options?: UpdateOneOptions
    ): Promise<UpdateWriteOpResult>
    updateOne(
        filter: FilterQuery<TSchema>,
        update: UpdateQuery<TSchema> | Partial<TSchema>,
        options: UpdateOneOptions,
        callback: MongoCallback<UpdateWriteOpResult>
    ): void
}

/** Update Query */
type KeysOfAType<TSchema, Type> = {
    [key in keyof TSchema]: NonNullable<TSchema[key]> extends Type ? key : never
}[keyof TSchema]
type KeysOfOtherType<TSchema, Type> = {
    [key in keyof TSchema]: NonNullable<TSchema[key]> extends Type ? never : key
}[keyof TSchema]

type AcceptedFields<TSchema, FieldType, AssignableType> = Readonly<
    Partial<Record<KeysOfAType<TSchema, FieldType>, AssignableType>>
>

/** It avoids using fields with not acceptable types */
type NotAcceptedFields<TSchema, FieldType> = Readonly<
    Partial<Record<KeysOfOtherType<TSchema, FieldType>, never>>
>

type DotAndArrayNotation<AssignableType> = Readonly<
    Record<string, AssignableType>
>

type ReadonlyPartial<TSchema> = {
    readonly [key in keyof TSchema]?: TSchema[key]
}

export type OnlyFieldsOfType<
    TSchema,
    FieldType = any,
    AssignableType = FieldType,
> = AcceptedFields<TSchema, FieldType, AssignableType> &
    NotAcceptedFields<TSchema, FieldType> &
    DotAndArrayNotation<AssignableType>

export type MatchKeysAndValues<TSchema> = ReadonlyPartial<TSchema> &
    DotAndArrayNotation<any>

type Unpacked<Type> = Type extends readonly (infer Element)[] ? Element : Type

type UpdateOptionalId<T> = T extends { _id?: any } ? OptionalId<T> : T

export type SortValues = -1 | 1

/**
 * Values for the $meta aggregation pipeline operator
 *
 * @see https://docs.mongodb.com/v3.6/reference/operator/aggregation/meta/#proj._S_meta
 */
export type MetaSortOperators = 'textScore' | 'indexKey'

export type MetaProjectionOperators =
    | MetaSortOperators
    /** Only for Atlas Search https://docs.atlas.mongodb.com/reference/atlas-search/scoring/ */
    | 'searchScore'
    /** Only for Atlas Search https://docs.atlas.mongodb.com/reference/atlas-search/highlighting/ */
    | 'searchHighlights'

export type SchemaMember<T, V> = { [P in keyof T]?: V } | Record<string, V>

export type SortOptionObject<T> = SchemaMember<
    T,
    number | { $meta?: MetaSortOperators | undefined }
>

export interface AddToSetOperators<Type> {
    $each: Type
}

export interface ArrayOperator<Type> {
    $each: Type
    $slice?: number | undefined
    $position?: number | undefined
    $sort?: SortValues | Record<string, SortValues> | undefined
}

export type SetFields<TSchema> = ({
    readonly [key in KeysOfAType<TSchema, readonly any[] | undefined>]?:
        | UpdateOptionalId<Unpacked<TSchema[key]>>
        | AddToSetOperators<UpdateOptionalId<Unpacked<TSchema[key]>>[]>
} & NotAcceptedFields<TSchema, readonly any[] | undefined>) &
    Readonly<Record<string, AddToSetOperators<any> | any>>

export type PushOperator<TSchema> = ({
    readonly [key in KeysOfAType<TSchema, readonly any[]>]?:
        | Unpacked<TSchema[key]>
        | ArrayOperator<Unpacked<TSchema[key]>[]>
} & NotAcceptedFields<TSchema, readonly any[]>) &
    Readonly<Record<string, ArrayOperator<any> | any>>

export type PullOperator<TSchema> = ({
    readonly [key in KeysOfAType<TSchema, readonly any[]>]?:
        | Partial<Unpacked<TSchema[key]>>
        | ObjectQuerySelector<Unpacked<TSchema[key]>>
} & NotAcceptedFields<TSchema, readonly any[]>) &
    Readonly<Record<string, QuerySelector<any> | any>>

export type PullAllOperator<TSchema> = ({
    readonly [key in KeysOfAType<TSchema, readonly any[]>]?: TSchema[key]
} & NotAcceptedFields<TSchema, readonly any[]>) &
    Readonly<Record<string, any[]>>

/**
 * Modifiers to use in update operations
 * @see https://docs.mongodb.com/v3.6/reference/operator/update
 *
 * @see https://docs.mongodb.com/v3.6/reference/operator/update-field/
 * @param $currentDate Sets the value of a field to current date, either as a Date or a Timestamp.
 * @param $inc Increments the value of the field by the specified amount.
 * @param $min Only updates the field if the specified value is less than the existing field value.
 * @param $max Only updates the field if the specified value is greater than the existing field value.
 * @param $mul Multiplies the value of the field by the specified amount.
 * @param $rename Renames a field.
 * @param $set Sets the value of a field in a document.
 * @param $setOnInsert Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents.
 * @param $unset Removes the specified field from a document.
 *
 * @see https://docs.mongodb.com/v3.6/reference/operator/update-array/
 * @param $addToSet Adds elements to an array only if they do not already exist in the set.
 * @param $pop Removes the first or last item of an array.
 * @param $pull Removes all array elements that match a specified query.
 * @param $push Adds an item to an array.
 * @param $pullAll Removes all matching values from an array.
 * @param $bit Performs bitwise `AND`, `OR`, and `XOR` updates of integer values.
 * @see https://docs.mongodb.com/v3.6/reference/operator/update-bitwise/
 *
 */
export interface UpdateQuery<TSchema> {
    $currentDate?:
        | OnlyFieldsOfType<
              TSchema,
              Date | Timestamp,
              true | { $type: 'date' | 'timestamp' }
          >
        | undefined
    $inc?: OnlyFieldsOfType<TSchema, NumericTypes | undefined> | undefined
    $min?: MatchKeysAndValues<TSchema> | undefined
    $max?: MatchKeysAndValues<TSchema> | undefined
    $mul?: OnlyFieldsOfType<TSchema, NumericTypes | undefined> | undefined
    $rename?: Record<string, string> | undefined
    $set?: MatchKeysAndValues<TSchema> | undefined
    $setOnInsert?: MatchKeysAndValues<TSchema> | undefined
    $unset?: OnlyFieldsOfType<TSchema, any, '' | 1 | true> | undefined

    $addToSet?: SetFields<TSchema> | undefined
    $pop?: OnlyFieldsOfType<TSchema, readonly any[], 1 | -1> | undefined
    $pull?: PullOperator<TSchema> | undefined
    $push?: PushOperator<TSchema> | undefined
    $pullAll?: PullAllOperator<TSchema> | undefined

    $bit?:
        | Record<string, Partial<Record<'and' | 'or' | 'xor', number>>>
        | undefined
}

/**
 * Available BSON types
 *
 * @see https://docs.mongodb.com/v3.6/reference/operator/query/type/#available-types
 */
export enum BsonType {
    Double = 1,
    String,
    Object,
    Array,
    BinData,
    /** @deprecated */
    Undefined,
    ObjectId,
    Boolean,
    Date,
    Null,
    Regex,
    /** @deprecated */
    DbPointer,
    JavaScript,
    /** @deprecated */
    Symbol,
    JavaScriptWithScope,
    Int,
    Timestamp,
    Long,
    Decimal,
    MinKey = -1,
    MaxKey = 127,
}

type BSONTypeAlias =
    | 'number'
    | 'double'
    | 'string'
    | 'object'
    | 'array'
    | 'binData'
    | 'undefined'
    | 'objectId'
    | 'bool'
    | 'date'
    | 'null'
    | 'regex'
    | 'dbPointer'
    | 'javascript'
    | 'symbol'
    | 'javascriptWithScope'
    | 'int'
    | 'timestamp'
    | 'long'
    | 'decimal'
    | 'minKey'
    | 'maxKey'

/** @see https://docs.mongodb.com/v3.6/reference/operator/query-bitwise */
type BitwiseQuery =
    | number /** <numeric bitmask> */
    | Binary /** <BinData bitmask> */
    | number[] /** [ <position1>, <position2>, ... ] */

// we can search using alternative types in mongodb e.g.
// string types can be searched using a regex in mongo
// array types can be searched using their element type
type RegExpForString<T> = T extends string ? RegExp | T : T
type MongoAltQuery<T> = T extends readonly (infer U)[]
    ? T | RegExpForString<U>
    : RegExpForString<T>

/**
 * Available query selector types
 *
 * @param $eq Matches values that are equal to a specified value.
 * @param $gt Matches values that are greater than a specified value.
 * @param $gte Matches values that are greater than or equal to a specified value.
 * @param $in Matches values that are greater than or equal to a specified value.
 * @param $lt Matches values that are less than a specified value.
 * @param $lte Matches values that are less than or equal to a specified value.
 * @param $ne Matches all values that are not equal to a specified value.
 * @param $nin Matches none of the values specified in an array.
 *
 * @param $and Joins query clauses with a logical `AND` returns all documents that match the conditions of both clauses.
 * @param $not Inverts the effect of a query expression and returns documents that do not match the query expression.
 * @param $nor Joins query clauses with a logical `NOR` returns all documents that fail to match both clauses.
 * @param $or Joins query clauses with a logical `OR` returns all documents that match the conditions of either clause.
 *
 * @param $exists Matches documents that have the specified field.
 * @param $type Selects documents if a field is of the specified type.
 *
 * @param $expr Allows use of aggregation expressions within the query language.
 * @param $jsonSchema Validate documents against the given JSON Schema.
 * @param $mod Performs a modulo operation on the value of a field and selects documents with a specified result.
 * @param $regex Selects documents where values match a specified regular expression.
 * @param $text Performs text search.
 * @param $where Matches documents that satisfy a JavaScript expression.
 *
 * @param $geoIntersects Selects geometries that intersect with a {@link https://docs.mongodb.com/v3.6/reference/glossary/#term-geojson GeoJSON} geometry.
 * The {@link https://docs.mongodb.com/v3.6/core/2dsphere/ 2dsphere} index supports {@link https://docs.mongodb.com/v3.6/reference/operator/query/geoIntersects/#op._S_geoIntersects $geoIntersects}.
 * @param $geoWithin Selects geometries within a bounding {@link https://docs.mongodb.com/v3.6/reference/geojson/#geospatial-indexes-store-geojson GeoJSON geometry}.
 * The {@link https://docs.mongodb.com/v3.6/core/2dsphere/ 2dsphere} and {@link https://docs.mongodb.com/v3.6/core/2d/ 2d} indexes
 * support {@link https://docs.mongodb.com/v3.6/reference/operator/query/geoWithin/#op._S_geoWithin $geoWithin}.
 * @param $near Returns geospatial objects in proximity to a point. Requires a geospatial index. The {@link https://docs.mongodb.com/v3.6/core/2dsphere/ 2dsphere}
 * and {@link https://docs.mongodb.com/v3.6/core/2d/ 2d} indexes support {@link https://docs.mongodb.com/v3.6/reference/operator/query/near/#op._S_near $near}.
 * @param $nearSphere Returns geospatial objects in proximity to a point on a sphere. Requires a geospatial index. The {@link https://docs.mongodb.com/v3.6/core/2dsphere/ 2dsphere} and
 * {@link https://docs.mongodb.com/v3.6/reference/operator/query/nearSphere/#op._S_nearSphere 2d} indexes support
 * {@link https://docs.mongodb.com/v3.6/reference/operator/query/nearSphere/#op._S_nearSphere $nearSphere}.
 *
 * @param $all Matches arrays that contain all elements specified in the query.
 * @param $elemMatch Selects documents if element in the array field matches all the specified
 * {@link https://docs.mongodb.com/v3.6/reference/operator/query/elemMatch/#op._S_elemMatch $elemMatch} conditions.
 * @param $size Selects documents if the array field is a specified size.
 *
 * @param $bitsAllClear Matches numeric or binary values in which a set of bit positions all have a value of `0`.
 * @param $bitsAllSet Matches numeric or binary values in which a set of bit positions all have a value of `1`.
 * @param $bitsAnyClear Matches numeric or binary values in which any bit from a set of bit positions has a value of `0`.
 * @param $bitsAnySet Matches numeric or binary values in which any bit from a set of bit positions has a value of `1`.
 *
 * @see https://docs.mongodb.com/v3.6/reference/operator/query/#query-selectors
 */
export interface QuerySelector<T> {
    // Comparison
    $eq?: T | undefined
    $gt?: T | undefined
    $gte?: T | undefined
    $in?: T[] | undefined
    $lt?: T | undefined
    $lte?: T | undefined
    $ne?: T | undefined
    $nin?: T[] | undefined
    // Logical
    $not?: T extends string
        ? QuerySelector<T> | RegExp
        : QuerySelector<T> | undefined
    // Element
    /**
     * When `true`, `$exists` matches the documents that contain the field,
     * including documents where the field value is null.
     */
    $exists?: boolean | undefined
    $type?: BSONType | BSONTypeAlias | undefined
    // Evaluation
    $expr?: any
    $jsonSchema?: any
    $mod?: T extends number ? [number, number] : never | undefined
    $regex?: T extends string ? RegExp | string : never | undefined
    $options?: T extends string ? string : never | undefined
    // Geospatial
    // TODO: define better types for geo queries
    $geoIntersects?: { $geometry: object } | undefined
    $geoWithin?: object | undefined
    $near?: object | undefined
    $nearSphere?: object | undefined
    $maxDistance?: number | undefined
    // Array
    // TODO: define better types for $all and $elemMatch
    $all?: T extends readonly (infer U)[] ? U[] : never | undefined
    $elemMatch?: T extends readonly (infer U)[] ? U : never | undefined
    $size?: T extends readonly (infer U)[] ? U : never | undefined
    // Bitwise
    $bitsAllClear?: BitwiseQuery | undefined
    $bitsAllSet?: BitwiseQuery | undefined
    $bitsAnyClear?: BitwiseQuery | undefined
    $bitsAnySet?: BitwiseQuery | undefined
}

export interface RootQuerySelector<T> {
    /** @see https://docs.mongodb.com/v3.6/reference/operator/query/and/#op._S_and */
    $and?: FilterQuery<T>[] | undefined
    /** @see https://docs.mongodb.com/v3.6/reference/operator/query/nor/#op._S_nor */
    $nor?: FilterQuery<T>[] | undefined
    /** @see https://docs.mongodb.com/v3.6/reference/operator/query/or/#op._S_or */
    $or?: FilterQuery<T>[] | undefined
    /** @see https://docs.mongodb.com/v3.6/reference/operator/query/text */
    $text?:
        | {
              $search: string
              $language?: string | undefined
              $caseSensitive?: boolean | undefined
              $diacriticSensitive?: boolean | undefined
          }
        | undefined
    /** @see https://docs.mongodb.com/v3.6/reference/operator/query/where/#op._S_where */
    $where?: string | Function | undefined
    /** @see https://docs.mongodb.com/v3.6/reference/operator/query/comment/#op._S_comment */
    $comment?: string | undefined
    // we could not find a proper TypeScript generic to support nested queries e.g. 'user.friends.name'
    // this will mark all unrecognized properties as any (including nested queries)
    [key: string]: any
}

export type ObjectQuerySelector<T> = T extends object
    ? { [key in keyof T]?: QuerySelector<T[key]> }
    : QuerySelector<T>

export type Condition<T> = MongoAltQuery<T> | QuerySelector<MongoAltQuery<T>>

export type FilterQuery<T> = {
    [P in keyof T]?: Condition<T[P]>
} & RootQuerySelector<T>

/** @see https://docs.mongodb.com/v3.6/reference/method/db.collection.bulkWrite/#insertone */
export interface BulkWriteInsertOneOperation<TSchema> {
    insertOne: {
        /** @ts-ignore */
        document: OptionalId<TSchema>
    }
}

/**
 * Options for the updateOne and updateMany operations
 *
 * @param arrayFilters Optional. An array of filter documents that determines which array elements to modify for an update operation on an array field.
 * @param collaction Optional. Specifies the collation to use for the operation.
 * @param filter The selection criteria for the update. The same {@link https://docs.mongodb.com/v3.6/reference/operator/query/#query-selectors query selectors}
 * as in the {@link https://docs.mongodb.com/v3.6/reference/method/db.collection.find/#db.collection.find find()} method are available.
 * @param update The modifications to apply.
 * @param upsert When true, the operation either creates a new document if no documents match the `filter` or updates the document(s) that match the `filter`.
 * For more details see {@link https://docs.mongodb.com/v3.6/reference/method/db.collection.update/#upsert-behavior upsert behavior}
 * @see https://docs.mongodb.com/v3.6/reference/method/db.collection.bulkWrite/#updateone-and-updatemany
 */
export interface BulkWriteUpdateOperation<TSchema> {
    arrayFilters?: object[] | undefined
    collation?: object | undefined
    filter: FilterQuery<TSchema>
    update: UpdateQuery<TSchema>
    upsert?: boolean | undefined
}
export interface BulkWriteUpdateOneOperation<TSchema> {
    updateOne: BulkWriteUpdateOperation<TSchema>
}
export interface BulkWriteUpdateManyOperation<TSchema> {
    updateMany: BulkWriteUpdateOperation<TSchema>
}

/**
 * Options for the replaceOne operation
 *
 * @param collation Optional. Specifies the {@link https://docs.mongodb.com/v3.6/reference/bson-type-comparison-order/#collation collation} to use for the operation.
 * @param filter The selection criteria for the update. The same {@link https://docs.mongodb.com/v3.6/reference/operator/query/#query-selectors query selectors}
 * as in the {@link https://docs.mongodb.com/v3.6/reference/method/db.collection.find/#db.collection.find find()} method are available.
 * @param replacement The replacement document.
 * @param upsert When true, replaceOne either inserts the document from the `replacement` parameter if no document matches the `filter`
 * or replaces the document that matches the `filter` with the `replacement` document.
 * For more details see {@link https://docs.mongodb.com/v3.6/reference/method/db.collection.update/#upsert-behavior upsert behavior}
 * @see https://docs.mongodb.com/v3.6/reference/method/db.collection.bulkWrite/#replaceone
 */
export interface BulkWriteReplaceOneOperation<TSchema> {
    replaceOne: {
        collation?: object | undefined
        filter: FilterQuery<TSchema>
        replacement: TSchema
        upsert?: boolean | undefined
    }
}

/**
 * Options for the deleteOne and deleteMany operations
 *
 * @param collation Optional. Specifies the collation to use for the operation.
 * @param filter Specifies deletion criteria using {@link https://docs.mongodb.com/v3.6/reference/operator/ query operators}.
 * @see https://docs.mongodb.com/v3.6/reference/method/db.collection.bulkWrite/#deleteone-and-deletemany
 */
export interface BulkWriteDeleteOperation<TSchema> {
    collation?: object | undefined
    filter: FilterQuery<TSchema>
}
export interface BulkWriteDeleteOneOperation<TSchema> {
    deleteOne: BulkWriteDeleteOperation<TSchema>
}
export interface BulkWriteDeleteManyOperation<TSchema> {
    deleteMany: BulkWriteDeleteOperation<TSchema>
}

/**
 * Possible operations with the Collection.bulkWrite method
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#bulkWrite
 */
export type BulkWriteOperation<TSchema> =
    | BulkWriteInsertOneOperation<TSchema>
    | BulkWriteUpdateOneOperation<TSchema>
    | BulkWriteUpdateManyOperation<TSchema>
    | BulkWriteReplaceOneOperation<TSchema>
    | BulkWriteDeleteOneOperation<TSchema>
    | BulkWriteDeleteManyOperation<TSchema>

/**
 * Returned object for the CollStats command in db.runCommand
 *
 * @see https://docs.mongodb.org/manual/reference/command/collStats/
 */
export interface CollStats {
    /**
     * Namespace.
     */
    ns: string
    /**
     * Number of documents.
     */
    count: number
    /**
     * Collection size in bytes.
     */
    size: number
    /**
     * Average object size in bytes.
     */
    avgObjSize: number
    /**
     * (Pre)allocated space for the collection in bytes.
     */
    storageSize: number
    /**
     * Number of extents (contiguously allocated chunks of datafile space).
     */
    numExtents: number
    /**
     * Number of indexes.
     */
    nindexes: number
    /**
     * Size of the most recently created extent in bytes.
     */
    lastExtentSize: number
    /**
     * Padding can speed up updates if documents grow.
     */
    paddingFactor: number
    /**
     * A number that indicates the user-set flags on the collection. userFlags only appears when using the mmapv1 storage engine.
     */
    userFlags?: number | undefined
    /**
     * Total index size in bytes.
     */
    totalIndexSize: number
    /**
     * Size of specific indexes in bytes.
     */
    indexSizes: {
        _id_: number
        [index: string]: number
    }
    /**
     * `true` if the collection is capped.
     */
    capped: boolean
    /**
     * The maximum number of documents that may be present in a capped collection.
     */
    max: number
    /**
     * The maximum size of a capped collection.
     */
    maxSize: number
    wiredTiger?: WiredTigerData | undefined
    indexDetails?: any
    ok: number
}

export interface WiredTigerData {
    LSM: {
        'bloom filter false positives': number
        'bloom filter hits': number
        'bloom filter misses': number
        'bloom filter pages evicted from cache': number
        'bloom filter pages read into cache': number
        'bloom filters in the LSM tree': number
        'chunks in the LSM tree': number
        'highest merge generation in the LSM tree': number
        'queries that could have benefited from a Bloom filter that did not exist': number
        'sleep for LSM checkpoint throttle': number
        'sleep for LSM merge throttle': number
        'total size of bloom filters': number
    }
    'block-manager': {
        'allocations requiring file extension': number
        'blocks allocated': number
        'blocks freed': number
        'checkpoint size': number
        'file allocation unit size': number
        'file bytes available for reuse': number
        'file magic number': number
        'file major version number': number
        'file size in bytes': number
        'minor version number': number
    }
    btree: {
        'btree checkpoint generation': number
        'column-store fixed-size leaf pages': number
        'column-store internal pages': number
        'column-store variable-size RLE encoded values': number
        'column-store variable-size deleted values': number
        'column-store variable-size leaf pages': number
        'fixed-record size': number
        'maximum internal page key size': number
        'maximum internal page size': number
        'maximum leaf page key size': number
        'maximum leaf page size': number
        'maximum leaf page value size': number
        'maximum tree depth': number
        'number of key/value pairs': number
        'overflow pages': number
        'pages rewritten by compaction': number
        'row-store internal pages': number
        'row-store leaf pages': number
    }
    cache: {
        'bytes currently in the cache': number
        'bytes read into cache': number
        'bytes written from cache': number
        'checkpoint blocked page eviction': number
        'data source pages selected for eviction unable to be evicted': number
        'hazard pointer blocked page eviction': number
        'in-memory page passed criteria to be split': number
        'in-memory page splits': number
        'internal pages evicted': number
        'internal pages split during eviction': number
        'leaf pages split during eviction': number
        'modified pages evicted': number
        'overflow pages read into cache': number
        'overflow values cached in memory': number
        'page split during eviction deepened the tree': number
        'page written requiring lookaside records': number
        'pages read into cache': number
        'pages read into cache requiring lookaside entries': number
        'pages requested from the cache': number
        'pages written from cache': number
        'pages written requiring in-memory restoration': number
        'tracked dirty bytes in the cache': number
        'unmodified pages evicted': number
    }
    cache_walk: {
        'Average difference between current eviction generation when the page was last considered': number
        'Average on-disk page image size seen': number
        'Clean pages currently in cache': number
        'Current eviction generation': number
        'Dirty pages currently in cache': number
        'Entries in the root page': number
        'Internal pages currently in cache': number
        'Leaf pages currently in cache': number
        'Maximum difference between current eviction generation when the page was last considered': number
        'Maximum page size seen': number
        'Minimum on-disk page image size seen': number
        'On-disk page image sizes smaller than a single allocation unit': number
        'Pages created in memory and never written': number
        'Pages currently queued for eviction': number
        'Pages that could not be queued for eviction': number
        'Refs skipped during cache traversal': number
        'Size of the root page': number
        'Total number of pages currently in cache': number
    }
    compression: {
        'compressed pages read': number
        'compressed pages written': number
        'page written failed to compress': number
        'page written was too small to compress': number
        'raw compression call failed, additional data available': number
        'raw compression call failed, no additional data available': number
        'raw compression call succeeded': number
    }
    cursor: {
        'bulk-loaded cursor-insert calls': number
        'create calls': number
        'cursor-insert key and value bytes inserted': number
        'cursor-remove key bytes removed': number
        'cursor-update value bytes updated': number
        'insert calls': number
        'next calls': number
        'prev calls': number
        'remove calls': number
        'reset calls': number
        'restarted searches': number
        'search calls': number
        'search near calls': number
        'truncate calls': number
        'update calls': number
    }
    reconciliation: {
        'dictionary matches': number
        'fast-path pages deleted': number
        'internal page key bytes discarded using suffix compression': number
        'internal page multi-block writes': number
        'internal-page overflow keys': number
        'leaf page key bytes discarded using prefix compression': number
        'leaf page multi-block writes': number
        'leaf-page overflow keys': number
        'maximum blocks required for a page': number
        'overflow values written': number
        'page checksum matches': number
        'page reconciliation calls': number
        'page reconciliation calls for eviction': number
        'pages deleted': number
    }
}

/**
 * Options for Collection.aggregate
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#aggregate
 */
export interface CollectionAggregationOptions {
    /**
     * The preferred read preference (ReadPreference.PRIMARY, ReadPreference.PRIMARY_PREFERRED, ReadPreference.SECONDARY, ReadPreference.SECONDARY_PREFERRED, ReadPreference.NEAREST).
     */
    readPreference?: ReadPreferenceOrMode | undefined
    /**
     * Return the query as cursor, on 2.6 > it returns as a real cursor
     * on pre 2.6 it returns as an emulated cursor.
     */
    cursor?: { batchSize?: number | undefined } | undefined
    /**
     * Explain returns the aggregation execution plan (requires mongodb 2.6 >).
     */
    explain?: boolean | undefined
    /**
     * Lets the server know if it can use disk to store
     * temporary results for the aggregation (requires mongodb 2.6 >).
     */
    allowDiskUse?: boolean | undefined
    /**
     * Specifies a cumulative time limit in milliseconds for processing operations
     * on the cursor. MongoDB interrupts the operation at the earliest following interrupt point.
     */
    maxTimeMS?: number | undefined
    /**
     * Allow driver to bypass schema validation in MongoDB 3.2 or higher.
     */
    bypassDocumentValidation?: boolean | undefined
    hint?: string | object | undefined
    raw?: boolean | undefined
    promoteLongs?: boolean | undefined
    promoteValues?: boolean | undefined
    promoteBuffers?: boolean | undefined
    collation?: CollationDocument | undefined
    comment?: string | undefined
    session?: ClientSession | undefined
}

/**
 * Options for Collection.insertMany
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#insertMany
 */
export interface CollectionInsertManyOptions extends CommonOptions {
    /**
     * Serialize functions on any object.
     */
    serializeFunctions?: boolean | undefined
    /**
     * Force server to assign _id values instead of driver.
     */
    forceServerObjectId?: boolean | undefined
    /**
     * Allow driver to bypass schema validation in MongoDB 3.2 or higher.
     */
    bypassDocumentValidation?: boolean | undefined
    /**
     * If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails.
     */
    ordered?: boolean | undefined
}

/**
 * Options for Collection.bulkWrite
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#bulkWrite
 */
export interface CollectionBulkWriteOptions extends CommonOptions {
    /**
     * Serialize functions on any object.
     */
    serializeFunctions?: boolean | undefined
    /**
     * Execute write operation in ordered or unordered fashion.
     */
    ordered?: boolean | undefined
    /**
     * Allow driver to bypass schema validation in MongoDB 3.2 or higher.
     */
    bypassDocumentValidation?: boolean | undefined
    //Force server to assign _id values instead of driver.
    forceServerObjectId?: boolean | undefined
}

/**
 * Returning object for Collection.bulkWrite operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~BulkWriteOpResult
 */
export interface BulkWriteOpResultObject {
    insertedCount?: number | undefined
    matchedCount?: number | undefined
    modifiedCount?: number | undefined
    deletedCount?: number | undefined
    upsertedCount?: number | undefined
    insertedIds?: Record<number, any> | undefined
    upsertedIds?: Record<number, any> | undefined
    result?: any
}

/**
 * Options for Collection.count
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#count
 */
export interface MongoCountPreferences {
    /**
     * The limit of documents to count.
     */
    limit?: number | undefined
    /**
     * The number of documents to skip for the count.
     */
    skip?: number | undefined
    /**
     * An index name hint for the query.
     */
    hint?: string | undefined
    /**
     * The preferred read preference
     */
    readPreference?: ReadPreferenceOrMode | undefined
    /**
     * Number of miliseconds to wait before aborting the query.
     */
    maxTimeMS?: number | undefined
    /**
     * Optional session to use for this operation
     */
    session?: ClientSession | undefined
}

/**
 * Options for Collection.distinct
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#distinct
 */
export interface MongoDistinctPreferences {
    /**
     * The preferred read preference
     */
    readPreference?: ReadPreferenceOrMode | undefined
    /**
     * Number of miliseconds to wait before aborting the query.
     */
    maxTimeMS?: number | undefined
    /**
     * Optional session to use for this operation
     */
    session?: ClientSession | undefined
}

/**
 * Returning object from delete write operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~deleteWriteOpResult
 */
export interface DeleteWriteOpResultObject {
    //The raw result returned from MongoDB, field will vary depending on server version.
    result: {
        //Is 1 if the command executed correctly.
        ok?: number | undefined
        //The total count of documents deleted.
        n?: number | undefined
    }
    //The connection object used for the operation.
    connection?: any
    //The number of documents deleted.
    deletedCount?: number | undefined
}

/**
 * Returning object from findAndModify operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~findAndModifyWriteOpResult
 */
export interface FindAndModifyWriteOpResultObject<TSchema> {
    //Document returned from findAndModify command.
    value?: TSchema | undefined
    //The raw lastErrorObject returned from the command.
    lastErrorObject?: any
    //Is 1 if the command executed correctly.
    ok?: number | undefined
}

/**
 * Returning object from findAndReplace operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOneAndReplace
 */
export interface FindOneAndReplaceOption<T> extends CommonOptions {
    projection?:
        | SchemaMember<T, ProjectionOperators | number | boolean | any>
        | undefined
    sort?: SortOptionObject<T> | undefined
    maxTimeMS?: number | undefined
    upsert?: boolean | undefined
    returnDocument?: 'after' | 'before' | undefined
    /** @deprecated Use returnDocument */
    returnOriginal?: boolean | undefined
    collation?: CollationDocument | undefined
}

/**
 * Possible projection operators
 *
 * @see https://docs.mongodb.com/v3.6/reference/operator/projection/
 */
export interface ProjectionOperators {
    /** @see https://docs.mongodb.com/v3.6/reference/operator/projection/elemMatch/#proj._S_elemMatch */
    $elemMatch?: object | undefined
    /** @see https://docs.mongodb.com/v3.6/reference/operator/projection/slice/#proj._S_slice */
    $slice?: number | [number, number] | undefined
    $meta?: MetaProjectionOperators | undefined
}

/**
 * Returning object from findOneAndUpdate operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOneAndUpdate
 */
export interface FindOneAndUpdateOption<T> extends FindOneAndReplaceOption<T> {
    arrayFilters?: object[] | undefined
}

/**
 * Returning object from findOneAndDelete operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOneAndDelete
 */
export interface FindOneAndDeleteOption<T> {
    projection?:
        | SchemaMember<T, ProjectionOperators | number | boolean | any>
        | undefined
    sort?: SortOptionObject<T> | undefined
    maxTimeMS?: number | undefined
    session?: ClientSession | undefined
    collation?: CollationDocument | undefined
}

/**
 * Options for Collection.geoHaystackSearch
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#geoHaystackSearch
 */
export interface GeoHaystackSearchOptions {
    readPreference?: ReadPreferenceOrMode | undefined
    maxDistance?: number | undefined
    search?: object | undefined
    limit?: number | undefined
    session?: ClientSession | undefined
}

/**
 * Create a new OrderedBulkOperation instance (INTERNAL TYPE, do not instantiate directly)
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/OrderedBulkOperation.html
 */
export interface OrderedBulkOperation {
    length: number
    /**
     * Execute the bulk operation
     *
     * @param _writeConcern Optional write concern. Can also be specified through options
     * @param options Optional settings
     * @param callback A callback that will be invoked when bulkWrite finishes/errors
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/OrderedBulkOperation.html#execute
     */
    execute(callback: MongoCallback<BulkWriteResult>): void
    execute(options?: FSyncOptions): Promise<BulkWriteResult>
    execute(
        options: FSyncOptions,
        callback: MongoCallback<BulkWriteResult>
    ): void
    /**
     * Builds a find operation for an update/updateOne/delete/deleteOne/replaceOne.
     * Returns a builder object used to complete the definition of the operation.
     *
     * @param selector The selector for the bulk operation. See {@link https://docs.mongodb.com/manual/reference/command/update/#update-command-q q documentation}
     * @returns helper object with which the write operation can be defined.
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/OrderedBulkOperation.html#find
     */
    find(selector: object): FindOperators
    /**
     * Add a single insert document to the bulk operation
     *
     * @param document the document to insert
     * @returns reference to self
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/OrderedBulkOperation.html#insert
     */
    insert(document: object): OrderedBulkOperation
}

/**
 * Returning upserted object from bulkWrite operations
 *
 * @see https://docs.mongodb.com/v3.6/reference/method/BulkWriteResult/index.html#BulkWriteResult.upserted
 */
export interface BulkWriteResultUpsertedIdObject {
    index: number
    _id: ObjectId
}

/**
 * Returning object from bulkWrite operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/BulkWriteResult.html
 */
export interface BulkWriteResult {
    /**
     * Evaluates to `true` if the bulk operation correctly executes
     */
    ok: boolean

    /**
     * The number of documents inserted, excluding upserted documents.
     */
    nInserted: number

    /**
     * The number of documents selected for update.
     *
     * If the update operation results in no change to the document,
     * e.g. `$set` expression updates the value to the current value,
     * nMatched can be greater than nModified.
     */
    nMatched: number

    /**
     * The number of existing documents updated.
     *
     * If the update/replacement operation results in no change to the document,
     * such as setting the value of the field to its current value,
     * nModified can be less than nMatched
     */
    nModified: number

    /**
     * The number of documents inserted by an {@link https://docs.mongodb.com/v3.6/reference/method/db.collection.update/#upsert-parameter upsert}.
     */
    nUpserted: number

    /**
     * The number of documents removed.
     */
    nRemoved: number

    /**
     * Returns an array of all inserted ids
     */
    getInsertedIds(): object[]
    /**
     * Retrieve lastOp if available
     */
    getLastOp(): object
    /**
     * Returns raw internal result
     */
    getRawResponse(): object

    /**
     * Returns the upserted id at the given index
     *
     * @param index the number of the upserted id to return, returns `undefined` if no result for passed in index
     */
    getUpsertedIdAt(index: number): BulkWriteResultUpsertedIdObject

    /**
     * Returns an array of all upserted ids
     */
    getUpsertedIds(): BulkWriteResultUpsertedIdObject[]
    /**
     * Retrieve the write concern error if any
     */
    getWriteConcernError(): WriteConcernError

    /**
     * Returns a specific write error object
     *
     * @param index of the write error to return, returns `null` if there is no result for passed in index
     */
    getWriteErrorAt(index: number): WriteError

    /**
     * Returns the number of write errors off the bulk operation
     */
    getWriteErrorCount(): number
    /**
     * Retrieve all write errors
     */
    getWriteErrors(): object[]
    /**
     * Returns `true` if the bulk operation contains a write error
     */
    hasWriteErrors(): boolean
}

/**
 * An error that occurred during a BulkWrite on the server.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/WriteError.html
 */
export interface WriteError {
    /**
     * Write concern error code.
     */
    code: number
    /**
     * Write concern error original bulk operation index.
     */
    index: number
    /**
     * Write concern error message.
     */
    errmsg: string
}

/**
 * An error representing a failure by the server to apply the requested write concern to the bulk operation.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/WriteConcernError.html
 */
export interface WriteConcernError {
    /**
     * Write concern error code.
     */
    code: number
    /**
     * Write concern error message.
     */
    errmsg: string
}

/**
 * A builder object that is returned from {@link https://mongodb.github.io/node-mongodb-native/3.6/api/BulkOperationBase.html#find BulkOperationBase#find}.
 * Is used to build a write operation that involves a query filter.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html
 */
export interface FindOperators {
    /**
     * Add a delete many operation to the bulk operation
     *
     * @returns reference to the parent BulkOperation
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#delete
     */
    delete(): OrderedBulkOperation
    /**
     * Add a delete one operation to the bulk operation
     *
     * @returns reference to the parent BulkOperation
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#deleteOne
     */
    deleteOne(): OrderedBulkOperation
    /**
     * Backwards compatibility for {@link https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#delete delete()}
     * @deprecated As of version 3.6.7
     *
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#remove
     */
    remove(): OrderedBulkOperation
    /**
     * Backwards compatibility for {@link https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#deleteOne deleteOne()}
     * @deprecated As of version 3.6.7
     *
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#removeOne
     */
    removeOne(): OrderedBulkOperation
    /**
     * Add a replace one operation to the bulk operation
     *
     * @param replacement the new document to replace the existing one with
     * @returns reference to the parent BulkOperation
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#replaceOne
     */
    replaceOne(replacement: object): OrderedBulkOperation
    /**
     * Add a multiple update operation to the bulk operation
     *
     * @param updateDocument An update field for an update operation. See {@link https://docs.mongodb.com/manual/reference/command/update/#update-command-u u documentation}
     * @param options Optional settings
     * @returns reference to the parent BulkOperation
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#update
     */
    update(
        updateDocument: object,
        options?: { hint: object }
    ): OrderedBulkOperation
    /**
     * Add a single update operation to the bulk operation
     *
     * @param updateDocument An update field for an update operation. See {@link https://docs.mongodb.com/manual/reference/command/update/#update-command-u u documentation}
     * @param options Optional settings
     * @returns reference to the parent BulkOperation
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#updateOne
     */
    updateOne(
        updateDocument: object,
        options?: { hint: object }
    ): OrderedBulkOperation
    /**
     * Upsert modifier for update bulk operation, noting that this operation is an upsert.
     *
     * @returns reference to self
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/FindOperators.html#upsert
     */
    upsert(): FindOperators
}

/**
 * Create a new UnorderedBulkOperation instance (INTERNAL TYPE, do not instantiate directly)
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/UnorderedBulkOperation.html
 */
export interface UnorderedBulkOperation {
    /**
     * Get the number of operations in the bulk.
     */
    length: number
    /**
     * Execute the bulk operation
     *
     * @param _writeConcern Optional write concern. Can also be specified through options.
     * @param options Optional settings
     * @param callback A callback that will be invoked when bulkWrite finishes/errors
     * @returns Promise if no callback is passed
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/UnorderedBulkOperation.html#execute
     */
    execute(callback: MongoCallback<BulkWriteResult>): void
    execute(options?: FSyncOptions): Promise<BulkWriteResult>
    execute(
        options: FSyncOptions,
        callback: MongoCallback<BulkWriteResult>
    ): void
    /**
     * Builds a find operation for an update/updateOne/delete/deleteOne/replaceOne.
     * Returns a builder object used to complete the definition of the operation.
     *
     * @param selector The selector for the bulk operation. See {@link https://docs.mongodb.com/manual/reference/command/update/#update-command-q q documentation}
     * @returns helper object with which the write operation can be defined.
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/UnorderedBulkOperation.html#find
     */
    find(selector: object): FindOperators
    /**
     * Add a single insert document to the bulk operation
     *
     * @param document the document to insert
     * @see https://mongodb.github.io/node-mongodb-native/3.6/api/UnorderedBulkOperation.html#insert
     */
    insert(document: object): UnorderedBulkOperation
}

/**
 * Options for Collection.findOne operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOne
 */
export interface FindOneOptions<T> {
    limit?: number | undefined
    sort?: [string, number][] | SortOptionObject<T> | undefined
    projection?:
        | SchemaMember<T, ProjectionOperators | number | boolean | any>
        | undefined
    /**
     * @deprecated Use options.projection instead
     */
    fields?: { [P in keyof T]: boolean | number } | undefined
    skip?: number | undefined
    hint?: object | undefined
    explain?: boolean | undefined
    snapshot?: boolean | undefined
    timeout?: boolean | undefined
    tailable?: boolean | undefined
    awaitData?: boolean | undefined
    batchSize?: number | undefined
    returnKey?: boolean | undefined
    maxScan?: number | undefined
    min?: number | undefined
    max?: number | undefined
    showDiskLoc?: boolean | undefined
    comment?: string | undefined
    raw?: boolean | undefined
    promoteLongs?: boolean | undefined
    promoteValues?: boolean | undefined
    promoteBuffers?: boolean | undefined
    readPreference?: ReadPreferenceOrMode | undefined
    partial?: boolean | undefined
    maxTimeMS?: number | undefined
    collation?: CollationDocument | undefined
    session?: ClientSession | undefined
}

/**
 * Options for Collection.insertOne operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#insertOne
 */
export interface CollectionInsertOneOptions extends CommonOptions {
    /**
     * Serialize functions on any object.
     */
    serializeFunctions?: boolean | undefined
    /**
     * Force server to assign _id values instead of driver.
     */
    forceServerObjectId?: boolean | undefined
    /**
     * Allow driver to bypass schema validation in MongoDB 3.2 or higher.
     */
    bypassDocumentValidation?: boolean | undefined
}

/**
 * Returning object from insert write operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~insertWriteOpResult
 */
export interface InsertWriteOpResult<TSchema extends { _id: any }> {
    insertedCount: number
    ops: TSchema[]
    insertedIds: Record<number, TSchema['_id']>
    connection: any
    result: { ok: number; n: number }
}

/**
 * Returning object from insertOne write operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~insertOneWriteOpResult
 */
export interface InsertOneWriteOpResult<TSchema extends { _id: any }> {
    insertedCount: number
    ops: TSchema[]
    insertedId: TSchema['_id']
    connection: any
    result: { ok: number; n: number }
}

/**
 *  Options for Collection.parallelCollectionScan operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#parallelCollectionScan
 */
export interface ParallelCollectionScanOptions {
    readPreference?: ReadPreferenceOrMode | undefined
    batchSize?: number | undefined
    numCursors?: number | undefined
    raw?: boolean | undefined
    session?: ClientSession | undefined
}

/**
 * Options for Collection.replaceOne operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#replaceOne
 */
export interface ReplaceOneOptions extends CommonOptions {
    upsert?: boolean | undefined
    bypassDocumentValidation?: boolean | undefined
}

/**
 * Options for Collection.updateOne operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateOne
 */
export interface UpdateOneOptions extends ReplaceOneOptions {
    arrayFilters?: object[] | undefined
}

/**
 * Options for Collection.updateMany operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateMany
 */
export interface UpdateManyOptions extends CommonOptions {
    upsert?: boolean | undefined
    arrayFilters?: object[] | undefined
}

/**
 * Returning object from update write operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~updateWriteOpResult
 */
export interface UpdateWriteOpResult {
    result: { ok: number; n: number; nModified: number }
    connection: any
    matchedCount: number
    modifiedCount: number
    upsertedCount: number
    upsertedId: { _id: ObjectId }
}

/**
 * Returning object from replace write operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~updateWriteOpResult
 */
export interface ReplaceWriteOpResult extends UpdateWriteOpResult {
    ops: any[]
}

/**
 * Options for Collection.mapReduce operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#mapReduce
 */
export interface MapReduceOptions {
    readPreference?: ReadPreferenceOrMode | undefined
    out?: object | undefined
    query?: object | undefined
    sort?: object | undefined
    limit?: number | undefined
    keeptemp?: boolean | undefined
    finalize?: Function | string | undefined
    scope?: object | undefined
    jsMode?: boolean | undefined
    verbose?: boolean | undefined
    bypassDocumentValidation?: boolean | undefined
    session?: ClientSession | undefined
}

export type CollectionMapFunction<TSchema> = (this: TSchema) => void

export type CollectionReduceFunction<TKey, TValue> = (
    key: TKey,
    values: TValue[]
) => TValue

/**
 * Returning object from write operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#~WriteOpResult
 */
export interface WriteOpResult {
    ops: any[]
    connection: any
    result: any
}

/**
 * Callback for cursor operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Cursor.html#~resultCallback
 */
export type CursorResult = object | null | boolean

type DefaultSchema = any

/**
 * Options for Cursor.count() operations.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Cursor.html#count
 */
export interface CursorCommentOptions {
    skip?: number | undefined
    limit?: number | undefined
    maxTimeMS?: number | undefined
    hint?: string | undefined
    readPreference?: ReadPreferenceOrMode | undefined
}

/**
 * The callback format for the forEach iterator method
 *
 * @param doc An emitted document for the iterator
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Cursor.html#~iteratorCallback
 */
export type IteratorCallback<T> = (doc: T) => void

/**
 * The callback error format for the forEach iterator method
 *
 * @param error An error instance representing the error during the execution.
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/Cursor.html#~endCallback
 */
export type EndCallback = (error: MongoError) => void

/**
 * Returning object for the AggregationCursor result callback
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/AggregationCursor.html#~resultCallback
 */
export type AggregationCursorResult = object | null

/**
 * Result object from CommandCursor.resultCallback
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/CommandCursor.html#~resultCallback
 */
export type CommandCursorResult = object | null

/**
 * Options for creating a new GridFSBucket
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/GridFSBucket.html
 */
export interface GridFSBucketOptions {
    bucketName?: string | undefined
    chunkSizeBytes?: number | undefined
    writeConcern?: WriteConcern | undefined
    readPreference?: ReadPreferenceOrMode | undefined
}

/**
 * Callback format for all GridFSBucket methods that can accept a callback.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/GridFSBucket.html#~errorCallback
 */
export interface GridFSBucketErrorCallback extends MongoCallback<void> {}

/**
 * Options for GridFSBucket.find() operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/GridFSBucket.html#find
 */
export interface GridFSBucketFindOptions {
    batchSize?: number | undefined
    limit?: number | undefined
    maxTimeMS?: number | undefined
    noCursorTimeout?: boolean | undefined
    skip?: number | undefined
    sort?: object | undefined
}

/**
 * Options for GridFSBucket.openUploadStream() operations
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/GridFSBucket.html#openUploadStream
 */
export interface GridFSBucketOpenUploadStreamOptions {
    chunkSizeBytes?: number | undefined
    metadata?: object | undefined
    contentType?: string | undefined
    aliases?: string[] | undefined
}

/**
 * Options for creating a new GridFSBucketReadStream
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/GridFSBucketReadStream.html
 */
export interface GridFSBucketReadStreamOptions {
    sort?: number | undefined
    skip?: number | undefined
    start?: number | undefined
    end?: number | undefined
}

/**
 * Options for creating a new GridFSBucketWriteStream
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/GridFSBucketWriteStream.html
 */
export interface GridFSBucketWriteStreamOptions extends WriteConcern {
    /**
     * Custom file id for the GridFS file.
     */
    id?: GridFSBucketWriteStreamId | undefined
    /**
     * The chunk size to use, in bytes
     */
    chunkSizeBytes?: number | undefined
    /**
     * If true, disables adding an md5 field to file data
     * @default false
     */
    disableMD5?: boolean | undefined
}

export type ChangeEventTypes =
    | 'insert'
    | 'delete'
    | 'replace'
    | 'update'
    | 'drop'
    | 'rename'
    | 'dropDatabase'
    | 'invalidate'
export interface ChangeEventBase<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TSchema extends Record<string, any> = DefaultSchema,
> {
    _id: ResumeToken
    /**
     * We leave this off the base type so that we can differentiate
     * by checking its value and get intelligent types on the other fields
     */
    // operationType: ChangeEventTypes;
    ns: {
        db: string
        coll: string
    }
    clusterTime: Timestamp
    txnNumber?: number | undefined
    lsid?:
        | {
              id: any
              uid: any
          }
        | undefined
}
export interface ChangeEventCR<
    TSchema extends Record<string, any> = DefaultSchema,
> extends ChangeEventBase<TSchema> {
    operationType: 'insert' | 'replace'
    fullDocument?: TSchema | undefined
    documentKey: {
        _id: ExtractIdType<TSchema>
    }
}
type FieldUpdates<TSchema> = Partial<TSchema> & Record<string, any>
export interface ChangeEventUpdate<
    TSchema extends Record<string, any> = DefaultSchema,
> extends ChangeEventBase<TSchema> {
    operationType: 'update'
    updateDescription: {
        /**
         * This is an object with all changed fields; if they are nested,
         * the keys will be paths, e.g. 'question.answer.0.text': 'new text'
         */
        updatedFields: FieldUpdates<TSchema>
        removedFields: (keyof TSchema | string)[]
    }
    fullDocument?: TSchema | undefined
    documentKey: {
        _id: ExtractIdType<TSchema>
    }
}
export interface ChangeEventDelete<
    TSchema extends Record<string, any> = DefaultSchema,
> extends ChangeEventBase<TSchema> {
    operationType: 'delete'
    documentKey: {
        _id: ExtractIdType<TSchema>
    }
}
export interface ChangeEventRename<
    TSchema extends Record<string, any> = DefaultSchema,
> extends ChangeEventBase<TSchema> {
    operationType: 'rename'
    to: {
        db: string
        coll: string
    }
}

export interface ChangeEventOther<
    TSchema extends Record<string, any> = DefaultSchema,
> extends ChangeEventBase<TSchema> {
    operationType: 'drop' | 'dropDatabase'
}

export interface ChangeEventInvalidate<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TSchema extends Record<string, any> = DefaultSchema,
> {
    _id: ResumeToken
    operationType: 'invalidate'
    clusterTime: Timestamp
}

export type ChangeEvent<TSchema extends object = { _id: ObjectId }> =
    | ChangeEventCR<TSchema>
    | ChangeEventUpdate<TSchema>
    | ChangeEventDelete<TSchema>
    | ChangeEventRename<TSchema>
    | ChangeEventOther<TSchema>
    | ChangeEventInvalidate<TSchema>

/**
 * Options that can be passed to a `ChangeStream`.
 * Note that `startAfter`, `resumeAfter`, and `startAtOperationTime` are all mutually exclusive, and the server will error if more than one is specified.
 *
 * @see https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#ChangeStreamOptions
 */
export interface ChangeStreamOptions {
    fullDocument?: 'default' | 'updateLookup' | undefined
    maxAwaitTimeMS?: number | undefined
    resumeAfter?: ResumeToken | undefined
    startAfter?: ResumeToken | undefined
    startAtOperationTime?: Timestamp | undefined
    batchSize?: number | undefined
    collation?: CollationDocument | undefined
    readPreference?: ReadPreferenceOrMode | undefined
}

type GridFSBucketWriteStreamId = string | number | object | ObjectId

export interface LoggerOptions {
    /**
     * Custom logger function
     */
    loggerLevel?: string | undefined
    /**
     * Override default global log level.
     */
    logger?: Log | undefined
}

export type Log = (message?: string, state?: LoggerState) => void

export interface LoggerState {
    type: string
    message: string
    className: string
    pid: number
    date: number
}

/**
 * Possible fields for a collation document
 *
 * @see https://docs.mongodb.com/v3.6/reference/collation/#collation-document-fields
 */
export interface CollationDocument {
    locale: string
    strength?: number | undefined
    caseLevel?: boolean | undefined
    caseFirst?: string | undefined
    numericOrdering?: boolean | undefined
    alternate?: string | undefined
    maxVariable?: string | undefined
    backwards?: boolean | undefined
    normalization?: boolean | undefined
}

/**
 * Possible indexes to create inside a collection
 *
 * @see https://docs.mongodb.com/v3.6/reference/command/createIndexes/
 */
export interface IndexSpecification {
    key: object
    name?: string | undefined
    background?: boolean | undefined
    unique?: boolean | undefined
    partialFilterExpression?: object | undefined
    sparse?: boolean | undefined
    expireAfterSeconds?: number | undefined
    storageEngine?: object | undefined
    weights?: object | undefined
    default_language?: string | undefined
    language_override?: string | undefined
    textIndexVersion?: number | undefined
    '2dsphereIndexVersion'?: number | undefined
    bits?: number | undefined
    min?: number | undefined
    max?: number | undefined
    bucketSize?: number | undefined
    collation?: CollationDocument | undefined
}
