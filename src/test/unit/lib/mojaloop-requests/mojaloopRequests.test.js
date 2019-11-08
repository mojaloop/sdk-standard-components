/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

const util = require('util');
const test = require('ava');
const request = require('request-promise-native');
const sinon = require('sinon');

const mr = require('../../../../lib/mojaloop-requests/mojaloopRequests.js');


const jwsSigningKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0eJEh3Op5p6x137lRkAsvmEBbd32dbRChrCUItZbtxjf/qfB
yD5k8Hn4n4vbqzP8XSGS0f6KmNC+iRaP74HVgzAqc4Uid4J8dtSBq3VmucYQYzLc
101QjuvD+SKmZwlw/q0PtulmqlASI2SbMfwcAraMi6ab7v5W4EGNeIPLEIo3BXsQ
DTCWqiZb7aXkHkcY7sOjAzK/2bNGYFmAthdYrHzvCkqnJ7LAHX3Oj7rJea5MqtuN
B9POZYaD10n9JuYWdwPqLrw6/hVgPSFEy+ulrVbXf54ZH0dfMThAYRvFrT81yulk
H95JhXWGdi6cTp6t8LVOKFhnNfxjWw0Jayj9xwIDAQABAoIBADB2u/Y/CgNbr5sg
DRccqHhJdAgHkep59kadrYch0knEL6zg1clERxCUSYmlxNKSjXp/zyQ4T46b3PNQ
x2m5pDDHxXWpT10jP1Q9G7gYwuCw0IXnb8EzdB+cZ0M28g+myXW1RoSo/nDjTlzn
1UJEgb9Kocd5cFZOWocr+9vRKumlZULMsA8yiNwlAfJHcMBM7acsa3myCqVhLyWt
4BQylVuLFa+A6QzpMXEwFCq8EOXf07gl1XVzC6LJ1fTa9gVM3N+YE+oEXKrsHCxG
/ACgKsjepL27QjJ7qvecWPP0F2LxEZYOm5tbXaKJTobzQUJHgUokanZMhjYprDsZ
zumLw9kCgYEA/DUWcnLeImlfq/EYdhejkl3J+WX3vhS23OqVgY1amu7CZzaai6vt
H0TRc8Zsbi4jgmFDU8PFzytP6qz6Tgom4R736z6oBi7bjnGyN17/NSbf+DaRVcM6
vnZr7jNC2FJlECmIN+dkwUA/YCr2SA7hxZXM9mIYSc+6+glDiIO5Cf0CgYEA1Qo/
uQbVHhW+Cp8H0kdMuhwUbkBquRrxRZlXS1Vrf3f9me9JLUy9UPWb3y3sKVurG5+O
SIlr4hDcZyXdE198MtDMhBIGqU9ORSjppJDNDVvtt+n2FD4XmWIU70vKBJBivX0+
Bow6yduis+p12fuvpvpnKCz8UjOgOQJhLZ4GQBMCgYBP6gpozVjxkm4ML2LO2IKt
+CXtbo/nnOysZ3BkEoQpH4pd5gFmTF3gUJAFnVPyPZBm2abZvejJ0jGKbLELVVAo
eQWZdssK2oIbSo9r2CAJmX3SSogWorvUafWdDoUZwlHfoylUfW+BhHgQYsyS3JRR
ZTwCveZwTPA0FgdeFE7niQKBgQCHaD8+ZFhbCejDqXb4MXdUJ3rY5Lqwsq491YwF
huKPn32iNNQnJcqCxclv3iln1Cr6oLx34Fig1KSyLv/IS32OcuY635Y6UPznumxe
u+aJIjADIILXNOwdAplZy6s4oWkRFaSx1rmbCa3tew2zImTv1eJxR76MpOGmupt3
uiQw3wKBgFjBT/aVKdBeHeP1rIHHldQV5QQxZNkc6D3qn/oAFcwpj9vcGfRjQWjO
ARzXM2vUWEet4OVn3DXyOdaWFR1ppehz7rAWBiPgsMg4fjAusYb9Mft1GMxMzuwT
Oyqsp6pzAWFrCD3JAoTLxClV+j5m+SXZ/ItD6ziGpl/h7DyayrFZ
-----END RSA PRIVATE KEY-----`;


async function testPutParties(t, jwsSign, jwsSignPutParties, expectUndefined) {
    try {
        // Everything is false by default
        const conf = {
            logger: console,
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
        };

        const stub = sinon.stub(request, 'Request');
        stub.callsFake(() => Promise.resolve({
            statusCode: 200,
            headers: {
                'content-length': 0
            },
        }));

        const testMr = new mr(conf);
        await testMr.putParties('MSISDN', '123456', { fspid: 'dummy' }, 'dummy');

        request.Request.restore();

        if (expectUndefined) {
            t.assert(typeof stub.getCall(0).args[0].headers['fspiop-signature'] === 'undefined');
        } else {
            t.assert(stub.getCall(0).args[0].headers['fspiop-signature']);
        }

        t.pass();
    } catch (err) {
        t.fail(err.stack || util.inspect(err));
    }
}


test.serial('signs put parties when jwsSign and jwsSignPutParties are true', async t => {
    await testPutParties(t, true, true, false);
});


test.serial('does not sign put parties when jwsSign is true and jwsSignPutParties is false', async t => {
    await testPutParties(t, true, false, true);
});


test.serial('does not sign put parties when jwsSign and jwsSignPutParties are false', async t => {
    await testPutParties(t, false, false, true);
});


test.serial('does not sign put parties when jwsSign is false and jwsSignPutParties is true', async t => {
    await testPutParties(t, false, true, true);
});


async function testPutQuotes(t, jwsSign, jwsSignPutParties, expectUndefined) {
    try {
        // Everything is false by default
        const conf = {
            logger: console,
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
        };

        const stub = sinon.stub(request, 'Request');
        stub.callsFake(() => Promise.resolve({
            statusCode: 200,
            headers: {
                'content-length': 0
            },
        }));

        const testMr = new mr(conf);
        await testMr.putQuotes('fake-quote', { quoteId: 'dummy' }, 'dummy');

        request.Request.restore();

        if (expectUndefined) {
            t.assert(typeof stub.getCall(0).args[0].headers['fspiop-signature'] === 'undefined');
        } else {
            t.assert(stub.getCall(0).args[0].headers['fspiop-signature']);
        }

        t.pass();
    } catch (err) {
        t.fail(err.stack || util.inspect(err));
    }
}


test.serial('signs put quotes when jwsSign is true and jwsSignPutParties is false', async t => {
    await testPutQuotes(t, true, false, false);
});


test.serial('does not sign put quotes when jwsSign is false and jwsSignPutParties is true', async t => {
    await testPutQuotes(t, false, true, true);
});


test.serial('does not sign put quotes when jwsSign is false and jwsSignPutParties is false', async t => {
    await testPutQuotes(t, false, false, true);
});


test.serial('signs put parties when jwsSign is true and jwsSignPutParties is not supplied', async t => {
    await testPutQuotes(t, true, undefined, false);
});


test.serial('does not sign put parties when jwsSign is false and jwsSignPutParties is not supplied', async t => {
    await testPutQuotes(t, false, undefined, true);
});
