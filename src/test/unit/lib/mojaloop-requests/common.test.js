const Test = require('tape')
const Common = require('../../../../lib/mojaloop-requests/common')
const util = require('util');

Test( 'common', commonTest => {

    commonTest.test('throwOrJson should', throwOrJsonTest => {

        throwOrJsonTest.test('pass if content-length is not populated in incoming http response', test => {
            try {
                const response = {
                    statusCode : 200,
                    headers : {
                        'content-length1' : 0
                    },
                    body: ''
                }
                const result = Common.throwOrJson(response)
                test.deepEquals(result,{})
            } catch (error) {
                test.fail('Expect validation to pass')
            }
            test.end()
        })

        throwOrJsonTest.test('throw an error if response code is <200', async test => {
            try {
                const response = {
                    statusCode : 100,
                    headers : {
                        'content-length1' : 0
                    },
                    body: ''
                }
                const result = await Common.throwOrJson(response)
                console.log(`result object: ${result}`)
                test.deepEquals(result.msg,'Request returned non-success status code 100')
                
            } catch (err) {
                console.log(`error object: ${err}`)
                // test.deepEquals(err.msg,'Request returned non-success status code 100')
            }
            test.end()
        })
    })
})