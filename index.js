var debug = require('debug')('block-sequence:mongo')
var _ = require('lodash')
var async = require('async')
var bigInt = require('big-integer')

module.exports = function init(config, cb) {

    if (Number.MAX_SAFE_INTEGER === undefined) Number.MAX_SAFE_INTEGER = 9007199254740991
    if (arguments.length === 1) return init({}, arguments[0])
    if (!config.url) return cb(new Error('url is required'))

    var MongoClient = config.client || require('mongodb').MongoClient
    var client
    var collection

    function ensure(options, cb) {
        if (options.name === null || options.name === undefined) return cb(new Error('name is required'))

        var name = options.name.toLowerCase()
        var value = options.value || 0
        var metadata = options.metadata || {}

        collection.findOneAndUpdate(
            { name: name },
            { $setOnInsert: { name: name, value: value, metadata: metadata } },
            { upsert: true, returnOriginal: false },
            function(err, result) {
                // Turns out there's no such thing as an atomic upsert in mongo
                if (err && err.code === 11000) return ensure(options, cb)
                if (err) return cb(err)
                deserialize(result.value, function(err, sequence) {
                    if (err) return cb(err)
                    cb(null, _.chain({})
                              .defaultsDeep(sequence)
                              .omit(['_id'])
                              .value()
                    )
                })
            }
        )
    }

    function allocate(options, cb) {

        var size = options.size || 1

        ensure(options, function(err, sequence) {
            if (err) return cb(err)
            collection.findOneAndUpdate(
                { name: sequence.name },
                { $inc: { value: size } },
                { upsert: true, returnOriginal: false },
                function(err, result) {
                    if (err) return cb(err)
                    deserialize(result.value, function(err, sequence) {
                        if (err) return cb(err)
                        cb(null, _.chain({ next: sequence.value - size + 1, remaining: size })
                                  .defaultsDeep(sequence)
                                  .omit(['_id', 'value'])
                                  .value()
                        )
                    })
                }
            )
        })
    }

    function remove(options, cb) {
        debug('Removing %s', options.name)
        if (options.name === null || options.name === undefined) return cb(new Error('name is required'))
        collection.findOneAndDelete({ name: options.name.toLowerCase() }, cb)
    }

    function deserialize(sequence, cb) {
        var value = bigInt(sequence.value)
        if (value.greater(Number.MAX_SAFE_INTEGER)) return cb(new Error('Sequence value exceeds Number.MAX_SAFE_INTEGER'))
        cb(null, sequence)
    }

    function close(cb) {
        client.close(cb)
    }

    function ensureCollection(cb) {
        debug('Ensuring gs_block_sequence collection')
        collection = client.db().collection('gs_block_sequence')
        collection.createIndex({ name: 1 }, { unique: true, w: 1 }, cb)
    }

    function connect(cb) {
        MongoClient.connect(config.url, config.options || {}, function(err, _client) {
            if (err) return cb(err)
            client = _client
            return cb()
        })
    }

    async.series([
        connect,
        ensureCollection
    ], function(err) {
        cb(err, {
            remove: remove,
            allocate: allocate,
            ensure: ensure,
            close: close
        })
    })
}

