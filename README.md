# block-sequence-mongo
A MongoDB implementation of [block-sequence](https://www.npmjs.com/package/block-sequence).

[![NPM version](https://img.shields.io/npm/v/block-sequence-mongo.svg?style=flat-square)](https://www.npmjs.com/package/block-sequence-mongo)
[![NPM downloads](https://img.shields.io/npm/dm/block-sequence-mongo.svg?style=flat-square)](https://www.npmjs.com/package/block-sequence-mongo)
[![Build Status](https://img.shields.io/travis/guidesmiths/block-sequence-mongo/master.svg)](https://travis-ci.org/guidesmiths/block-sequence-mongo)
[![Code Climate](https://codeclimate.com/github/guidesmiths/block-sequence-mongo/badges/gpa.svg)](https://codeclimate.com/github/guidesmiths/block-sequence-mongo)
[![Test Coverage](https://codeclimate.com/github/guidesmiths/block-sequence-mongo/badges/coverage.svg)](https://codeclimate.com/github/guidesmiths/block-sequence-mongo/coverage)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
[![Dependency Status](https://david-dm.org/guidesmiths/block-sequence-mongo.svg)](https://david-dm.org/guidesmiths/block-sequence-mongo)
[![devDependencies Status](https://david-dm.org/guidesmiths/block-sequence-mongo/dev-status.svg)](https://david-dm.org/guidesmiths/block-sequence-mongo?type=dev)

## Usage
```js
const BlockArray = require('block-sequence').BlockArray
const init = require('block-sequence-mongo')

// Initialise the Mongo Block Sequence Driver
init({ url: 'mongodb://localhost/sequences', options: { } }, (err, driver) => {
    if (err) throw err

    // Ensure the sequence exists
    driver.ensure({ name: 'my-sequence' }, (err, sequence) => {
        if (err) throw err

        // Create a block array containing 1000 ids per block (defaults to 2 blocks)
        var idGenerator = new BlockArray({ block: { sequence: sequence, driver: driver, size: 1000 } })

        // Grab the next id
        idGenerator.next((err, id) => {
            if (err) throw err
            console.log(id)
        })
    })
})
```
See https://www.npmjs.com/package/mongodb for all connection parameters


