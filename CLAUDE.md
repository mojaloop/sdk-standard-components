# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Mojaloop SDK Standard Components** library - a foundational package providing standard components for DFSP (Digital Financial Service Provider) to Mojaloop switch interfaces. It encodes best practices for:

- **JWS (JSON Web Signature)** - Signing and verification
- **Interledger Protocol (ILP)** - Message generation and verification
- **Mojaloop Requests** - HTTP request abstraction with compliant header handling
- **OIDC Authentication** - Token management and refresh (formerly WSO2Auth)
- **Error Handling** - Mojaloop API specification compliant errors

This library is consumed by the Mojaloop SDK Scheme Adapter and other Mojaloop components.

## Commands

### Build & Lint
```bash
npm run build          # TypeScript type checking (tsc)
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix ESLint issues
```

### Testing
```bash
npm test                    # Run all unit tests
npm run test:unit           # Same as above (alias)
npm run test:coverage       # Run tests with coverage report
npm run test:coverage-check # Run tests with coverage thresholds
```

### Dependency & Security Management
```bash
npm run dep:check      # Check for outdated dependencies
npm run dep:update     # Update dependencies
npm run audit:fix      # Fix npm audit issues
npm run audit:check    # Verify audit exceptions (CI compliance)
```

The project uses `audit-ci` with configuration in `audit-ci.jsonc`. Any unresolved vulnerabilities must be added to the allowlist with explanation.

### Release
```bash
npm run release   # Create new release (uses standard-version)
npm run snapshot  # Create snapshot/pre-release
```

## Architecture

### Request Flow Hierarchy

The library follows a layered inheritance pattern for making Mojaloop API requests:

1. **BaseRequests** (`src/lib/requests/baseRequests.js`)
   - Base class containing core HTTP request logic
   - Handles JWS signing, TLS, OIDC auth, and retry logic
   - Implements `_get()`, `_post()`, `_put()`, `_patch()`, `_delete()` methods
   - Manages API transformation between FSPIOP and ISO20022 formats via `ApiTransformer`
   - Configurable OIDC auth retry mechanism via `config.oidc.retryOidcAuthFailureTimes`

2. **MojaloopRequests** (`src/lib/requests/mojaloopRequests.js`)
   - Extends `BaseRequests`
   - Implements standard Mojaloop FSPIOP API operations (parties, quotes, transfers, etc.)
   - Primary class for Switch-to-DFSP communication

3. **ThirdpartyRequests** (`src/lib/requests/thirdpartyRequests.js`)
   - Extends `BaseRequests`
   - Implements third-party API operations (consents, authorization, etc.)
   - Used for PISP (Payment Initiation Service Provider) flows

### Key Components

**Authentication**
- `OIDCAuth` (`src/lib/OIDCAuth/index.js`) - OIDC token management with automatic refresh
- Legacy alias: `WSO2Auth` maps to `OIDCAuth` for backward compatibility

**Cryptography**
- `Jws` (`src/lib/jws/`) - JWS signing (`jwsSigner.js`) and validation (`jwsValidator.js`)

**ILP (Interledger Protocol)**
- `Ilp` (`src/lib/ilp/`) - Factory pattern with `IlpV1` and `IlpV4` implementations
- Used for generating and verifying fulfilment/condition pairs

**HTTP Layer**
- `httpRequester` (`src/lib/httpRequester/`) - Abstraction over axios with retry logic
- Supports custom HTTP/HTTPS agents via `config.httpAgent` and `config.httpsAgent`

**API Transformation**
- `ApiTransformer` (`src/lib/requests/apiTransformer.js`) - Converts between FSPIOP and ISO20022 formats
- Controlled via `config.apiType` (defaults to FSPIOP)

## TypeScript Support

The project is JavaScript-based but provides TypeScript definitions in `src/index.d.ts`.

**Completed modules:** ThirdpartyRequests, OIDCAuth (WSO2Auth), Logger, request, Errors
**TODO:** Ilp, Jws, MojaloopRequests

When modifying exported APIs, update `src/index.d.ts` accordingly.

## Code Style

- **Indentation:** 4 spaces (enforced by ESLint)
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Line endings:** Unix (LF)

Configuration in `.eslintrc.json`

## Import Paths

The project uses Node.js subpath imports (package.json `imports` field):
```javascript
#src/*   → ./src/*.js
#test/*  → ./test/*.js
```

Use these for internal cross-references to avoid relative path issues.

## Testing Notes

- Tests use Jest with `axios-mock-adapter` and `nock` for HTTP mocking
- Fixtures are in `test/fixtures.js`
- Test structure mirrors source: `test/unit/lib/requests/baseRequests.test.js` tests `src/lib/requests/baseRequests.js`
- When testing OIDC auth retry logic, use `retryOidcAuthFailureTimes` config option

## Common Workflows

**Adding New Request Types:**
1. Add method to appropriate class (MojaloopRequests or ThirdpartyRequests)
2. Use base class methods (`_get`, `_post`, etc.) from BaseRequests
3. Add TypeScript definitions to `src/index.d.ts`
4. Add unit tests mirroring the source file structure

**Modifying Request Behavior:**
Most shared logic lives in `BaseRequests`. Changes there affect all request types.
