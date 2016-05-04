var debug = require('debug')('block-sequence:mongo')
var MongoClient = require('mongodb').MongoClient
var _ = require('lodash')
var async = require('async')

module.exports = function init(config, cb) {

    if (arguments.length === 1) return init({}, arguments[0])
    if (!config.url) return cb(new Error('url is required'))

    var db
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
                if (err) return cb(err)
                cb(null, _.chain({})
                          .defaultsDeep(result.value)
                          .omit(['_id'])
                          .value()
                )
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
                    var sequence = result.value
                    cb(null, _.chain({ next: sequence.value - size + 1, remaining: size })
                              .defaultsDeep(sequence)
                              .omit(['_id', 'value'])
                              .value()
                    )
                }
            )
        })
    }

    function remove(options, cb) {
        debug('Removing %s', options.name)
        if (options.name === null || options.name === undefined) return cb(new Error('name is required'))
        collection.findOneAndDelete({ name: options.name.toLowerCase() }, cb)
    }

    function close(cb) {
        db.close(cb)
    }

    function ensureCollection(cb) {
        debug('Ensuring gs_block_sequence collection')
        collection = db.collection('gs_block_sequence')
        collection.createIndex('gs_block_sequence_name', { name: 1 }, { unique:true, w:1}, cb)
    }

    function connect(cb) {
        MongoClient.connect(config.url, config.options || {}, function(err, _db) {
            if (err) return cb(err)
            db = _db
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

