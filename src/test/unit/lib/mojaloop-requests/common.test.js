const Test = require('tape')
const Common = require('../../../../lib/mojaloop-requests/common')
const util = require('util');

Test( 'common.js', commonTest => {

    commonTest.test('throwOrJson should', throwOrJsonTest => {

        throwOrJsonTest.test('pass if content-length is not populated in incoming http response', test => {
            try {
                const response = {
                    statusCode : 200,
                    headers : {
                        'content-type' : 'application-json'
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

        throwOrJsonTest.test('throw an error if content-length is greater than 0', async test => {
            try {
                const response = {
                    statusCode : 200,
                    headers : {
                        'content-length' : 10
                    },
                    body: ''
                }
                await Common.throwOrJson(response)
                
            } catch (error) {
                test.deepEquals(error.message,'Expected empty response body but got content: ')
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
                
            } catch (err) {
                test.deepEquals(err.message,'Request returned non-success status code 100')
            }
            test.end()
        })
    })
})