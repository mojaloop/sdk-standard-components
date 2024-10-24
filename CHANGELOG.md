# Changelog: [mojaloop/sdk-standard-components](https://github.com/mojaloop/sdk-standard-components)
## [19.2.0](https://github.com/mojaloop/sdk-standard-components/compare/v19.1.3...v19.2.0) (2024-10-24)


### Features

* **csi-785:** unified ILP interface ([#217](https://github.com/mojaloop/sdk-standard-components/issues/217)) ([00a78e9](https://github.com/mojaloop/sdk-standard-components/commit/00a78e9df2a5b1ce42f25e49ce482873ba85f92b))

### [19.1.3](https://github.com/mojaloop/sdk-standard-components/compare/v19.1.2...v19.1.3) (2024-10-24)


### Chore

* update deps to remove circular ref ([#216](https://github.com/mojaloop/sdk-standard-components/issues/216)) ([ee5f547](https://github.com/mojaloop/sdk-standard-components/commit/ee5f547e12ac80b7019969e2495b4f25a2d9f513))

### [19.1.2](https://github.com/mojaloop/sdk-standard-components/compare/v19.1.1...v19.1.2) (2024-10-23)

### [19.1.1](https://github.com/mojaloop/sdk-standard-components/compare/v19.1.0...v19.1.1) (2024-10-23)


### Chore

* bump dependencies to avoid circular ref ([#214](https://github.com/mojaloop/sdk-standard-components/issues/214)) ([e2649c7](https://github.com/mojaloop/sdk-standard-components/commit/e2649c76df832865d785a4576bf5aa3a35abe7d3))

## [19.1.0](https://github.com/mojaloop/sdk-standard-components/compare/v19.0.0...v19.1.0) (2024-10-22)


### Features

* (CSI-110) Add capability to transform outbound mojaloop http requests from FSPIOP to ISO20022 ([#211](https://github.com/mojaloop/sdk-standard-components/issues/211)) ([1d389cd](https://github.com/mojaloop/sdk-standard-components/commit/1d389cdc187e54179cda2d8818c17445c719b55f))

## [19.0.0](https://github.com/mojaloop/sdk-standard-components/compare/v18.4.1...v19.0.0) (2024-10-02)


### Features

* **csi-194:** add support for both ilp versions: v1 and v4 ([#209](https://github.com/mojaloop/sdk-standard-components/issues/209)) ([0028fda](https://github.com/mojaloop/sdk-standard-components/commit/0028fda54b6e4c8dcfdb33e07000f8f7dacae681))

### [18.4.1](https://github.com/mojaloop/sdk-standard-components/compare/v18.4.0...v18.4.1) (2024-09-13)


### Bug Fixes

* properly stop token refresh ([#210](https://github.com/mojaloop/sdk-standard-components/issues/210)) ([d1aef53](https://github.com/mojaloop/sdk-standard-components/commit/d1aef53b0822283995c8ab34c5980392728f0dbe))

## [18.4.0](https://github.com/mojaloop/sdk-standard-components/compare/v18.3.0...v18.4.0) (2024-08-06)


### Features

* **csi-16:** added PAYEE_IDENTIFIER_NOT_VALID error ([#208](https://github.com/mojaloop/sdk-standard-components/issues/208)) ([bd4a397](https://github.com/mojaloop/sdk-standard-components/commit/bd4a3972c241781bb14537ddb0abdbd7a40e321f))

## [18.3.0](https://github.com/mojaloop/sdk-standard-components/compare/v18.2.1...v18.3.0) (2024-07-04)


### Features

* enable elliptic curve es256 for JWS ([#205](https://github.com/mojaloop/sdk-standard-components/issues/205)) ([ee5036d](https://github.com/mojaloop/sdk-standard-components/commit/ee5036dbe587cf998113208ece57b769123eba22))

### [18.2.1](https://github.com/mojaloop/sdk-standard-components/compare/v18.2.0...v18.2.1) (2024-06-27)


### Chore

* update types for fspiop 2.0 ([#207](https://github.com/mojaloop/sdk-standard-components/issues/207)) ([8eea656](https://github.com/mojaloop/sdk-standard-components/commit/8eea6565a0a33d8981e9a65238c376c4813a6372))

## [18.2.0](https://github.com/mojaloop/sdk-standard-components/compare/v18.1.0...v18.2.0) (2024-06-07)


### Features

* fx-impl ([#198](https://github.com/mojaloop/sdk-standard-components/issues/198)) ([12a36d5](https://github.com/mojaloop/sdk-standard-components/commit/12a36d5d0d33d7ad5ec1852f66aedd0f5447a385)), closes [mojaloop/#3618](https://github.com/mojaloop/project/issues/3618)


### Bug Fixes

* build ([#204](https://github.com/mojaloop/sdk-standard-components/issues/204)) ([5766f79](https://github.com/mojaloop/sdk-standard-components/commit/5766f79f9f0e1e87dce42e1e9d71635d969e0712))


### Chore

* **deps-dev:** bump ip from 2.0.0 to 2.0.1 ([#202](https://github.com/mojaloop/sdk-standard-components/issues/202)) ([12ec428](https://github.com/mojaloop/sdk-standard-components/commit/12ec428441d6ce1455d12320aac3aee9be6bbe2d))
* **deps-dev:** bump undici from 5.28.3 to 5.28.4 ([#201](https://github.com/mojaloop/sdk-standard-components/issues/201)) ([0a7df96](https://github.com/mojaloop/sdk-standard-components/commit/0a7df96f89c1e3819e308312e865b75103f398d7))

## [18.1.0](https://github.com/mojaloop/sdk-standard-components/compare/v18.0.1...v18.1.0) (2024-03-19)


### Features

* **iprod-93:** added original statusCode to request error ([#189](https://github.com/mojaloop/sdk-standard-components/issues/189)) ([78e53f8](https://github.com/mojaloop/sdk-standard-components/commit/78e53f89dab5fb7bb19e3d4e72cb2bd9d27c1a44))

### [18.0.1](https://github.com/mojaloop/sdk-standard-components/compare/v18.0.0...v18.0.1) (2024-03-18)


### Chore

* **mojaloop/#3815:** fix error catch logger level ([#199](https://github.com/mojaloop/sdk-standard-components/issues/199)) ([2df11e4](https://github.com/mojaloop/sdk-standard-components/commit/2df11e43cff8fe861b05c2489d3605109037c022))

## [18.0.0](https://github.com/mojaloop/sdk-standard-components/compare/v17.4.0...v18.0.0) (2024-03-12)


### ⚠ BREAKING CHANGES

* **mojaloop/#3759:** change logger functions to object variables (#196)

### Features

* **mojaloop/#3759:** change logger functions to object variables ([#196](https://github.com/mojaloop/sdk-standard-components/issues/196)) ([f78818d](https://github.com/mojaloop/sdk-standard-components/commit/f78818d0bcbbfab1dd9f7ee87f514a69dfaff5bb)), closes [mojaloop/#3759](https://github.com/mojaloop/project/issues/3759)


### Chore

* update deps ([#197](https://github.com/mojaloop/sdk-standard-components/issues/197)) ([67b8168](https://github.com/mojaloop/sdk-standard-components/commit/67b81685004ffa1516469eb60b12fb76a84663a5))

## [17.4.0](https://github.com/mojaloop/sdk-standard-components/compare/v17.3.0...v17.4.0) (2024-02-20)


### Features

* **mojaloop/#3750:** add isLevelEnabled functions ([#194](https://github.com/mojaloop/sdk-standard-components/issues/194)) ([7a8e8d9](https://github.com/mojaloop/sdk-standard-components/commit/7a8e8d9861d9dd4096525458058320e827b146f3)), closes [mojaloop/#3750](https://github.com/mojaloop/project/issues/3750)


### Bug Fixes

* fix snapshot mishap ([#195](https://github.com/mojaloop/sdk-standard-components/issues/195)) ([f921f38](https://github.com/mojaloop/sdk-standard-components/commit/f921f38efe437d0d4656d30f7d4ba3db4b65a8d8))

## [17.3.0](https://github.com/mojaloop/sdk-standard-components/compare/v17.2.0...v17.3.0) (2024-02-16)


### Features

* **mojaloop/#3750:** optimize object serialization and add log level silencing ([#193](https://github.com/mojaloop/sdk-standard-components/issues/193)) ([637cba1](https://github.com/mojaloop/sdk-standard-components/commit/637cba1d9e30b3c6b4459fa2896fb23b4a9e785a)), closes [mojaloop/#3750](https://github.com/mojaloop/project/issues/3750)

## [17.2.0](https://github.com/mojaloop/sdk-standard-components/compare/v17.1.3...v17.2.0) (2024-02-13)


### Features

* **mojaloop/#3670:** add headers to callbacks ([#191](https://github.com/mojaloop/sdk-standard-components/issues/191)) ([40d0a72](https://github.com/mojaloop/sdk-standard-components/commit/40d0a72a17f0389b2bc11bdb8dc435caf4f9d315)), closes [mojaloop/#3670](https://github.com/mojaloop/project/issues/3670)

### [17.1.3](https://github.com/mojaloop/sdk-standard-components/compare/v17.1.2...v17.1.3) (2023-08-29)

### [17.1.2](https://github.com/mojaloop/sdk-standard-components/compare/v17.1.1...v17.1.2) (2023-08-24)

### [17.1.1](https://github.com/mojaloop/sdk-standard-components/compare/v17.1.0...v17.1.1) (2022-07-12)

## [17.1.0](https://github.com/mojaloop/sdk-standard-components/compare/v17.0.4...v17.1.0) (2022-07-04)


### Features

* log request error response ([#174](https://github.com/mojaloop/sdk-standard-components/issues/174)) ([24c4f68](https://github.com/mojaloop/sdk-standard-components/commit/24c4f688368de1ab3d2ea1436a491571e6cebcb1))

### [17.0.4](https://github.com/mojaloop/sdk-standard-components/compare/v17.0.3...v17.0.4) (2022-06-21)

### [17.0.3](https://github.com/mojaloop/sdk-standard-components/compare/v17.0.2...v17.0.3) (2022-05-23)


### Bug Fixes

* fix Logger type definitions ([#172](https://github.com/mojaloop/sdk-standard-components/issues/172)) ([c313848](https://github.com/mojaloop/sdk-standard-components/commit/c3138482879b7e5654d6591b9632e84e0cfcd01b))

### [17.0.2](https://github.com/mojaloop/sdk-standard-components/compare/v17.0.1...v17.0.2) (2022-05-20)


### Bug Fixes

* fix declaration file path ([#171](https://github.com/mojaloop/sdk-standard-components/issues/171)) ([547a9e4](https://github.com/mojaloop/sdk-standard-components/commit/547a9e41edcf693b02b07cc94797da887c9e018e))

### [17.0.1](https://github.com/mojaloop/sdk-standard-components/compare/v17.0.0...v17.0.1) (2022-05-19)

## [17.0.0](https://github.com/mojaloop/sdk-standard-components/compare/v16.0.1...v17.0.0) (2022-05-17)


### ⚠ BREAKING CHANGES

* **mojaloop/#2092:** major version bump for node v16 LTS support, and re-structuring of project directories to align to core Mojaloop repositories!

### Features

* **mojaloop/#2092:** upgrade nodeJS version for core services ([#168](https://github.com/mojaloop/sdk-standard-components/issues/168)) ([e0191bf](https://github.com/mojaloop/sdk-standard-components/commit/e0191bfa9942ccb3acb4335b41d65c2c903b770f)), closes [mojaloop/#2092](https://github.com/mojaloop/project/issues/2092)
