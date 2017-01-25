var complianceTests = require('block-sequence-compliance-tests')
var BlockSequence = require('../index')

BlockSequence({ url: 'mongodb://127.0.0.1/bs_test' }, function(err, blockSequence) {
    if (err) throw err
    complianceTests(blockSequence).onFinish(blockSequence.close)
})
