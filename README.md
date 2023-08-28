[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/sdk-standard-components.svg?style=flat)](https://github.com/mojaloop/sdk-standard-components/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/sdk-standard-components.svg?style=flat)](https://github.com/mojaloop/sdk-standard-components/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/sdk-standard-components.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/sdk-standard-components)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/sdk-standard-components.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/sdk-standard-components)
[![CircleCI](https://circleci.com/gh/mojaloop/sdk-standard-components.svg?style=svg)](https://circleci.com/gh/mojaloop/sdk-standard-components)

# Mojaloop DFSP SDK Standard Components

This package contains a set of components that encode standard practices for enabling the following features of a DFSP to Mojaloop switch interface:

## Usage

```
npm install @mojaloop/sdk-standard-components
```

 1. JWS (JSON Web Signature) - For signing and signature verification
 2. Interledger Protocol - For generating and verifying Interledger message content
 3. Mojaloop Requests - An abstration that simplifies making HTTP requests to Mojaloop API compliant peers demonstrating specification compliant HTTP header handling and JSON Web Signatures
 4. Errors - Mojaloop API specification compliant error helpers

For an example usage of these components please see the Mojaloop SDK Scheme Adapter available [here](http://www.github.com/mojaloop/sdk-scheme-adapter).

For information on the background and context of this project please see the presentation [here](docs/Mojaloop%20-%20Modusbox%20Onboarding%20functionality.pdf)

## Auditing Dependencies

We use `audit-ci` along with `npm audit` to check dependencies for node vulnerabilities, and keep track of resolved dependencies with an `audit-ci.jsonc` file.

To start a new resolution process, run:

```bash
npm run audit:fix
```

You can then check to see if the CI will pass based on the current dependencies with:

```bash
npm run audit:check
```

The [audit-ci.jsonc](./audit-ci.jsonc) contains any audit-exceptions that cannot be fixed to ensure that CircleCI will build correctly.


## Typescript Types

To aid consumers of this library, we are starting to work on adding typescript declarations for the `sdk-standard-components`. This is an incremental process, so please be patient as we gradually add typings to each module.

Types currently live in `./src/index.d.ts`


**Completed Modules**
- `ThirdpartyRequests`
- `WSO2Auth`
- `Logger`
- `request`
- `Errors`

**TODO**
- `Ilp`
- `Jws`
- `MojaloopRequests`
