# Testing

変更の検証・テストの追加を行う人向け。

[Contribution guide](../../CONTRIBUTING.md)

You can run non-backend tests by executing following commands:
```sh
pnpm --filter frontend test
pnpm --filter misskey-js test
```

Backend tests require manual preparation of servers. See the next section for more on this.

## Backend
There are three types of test codes for the backend:
- Unit tests: [`/packages/backend/test/unit`](/packages/backend/test/unit)
- Single-server E2E tests: [`/packages/backend/test/e2e`](/packages/backend/test/e2e)
- Multiple-server E2E tests: [`/packages/backend/test-federation`](/packages/backend/test-federation)

### Running Unit Tests or Single-server E2E Tests
1. Create a config file:
```sh
cp .github/misskey/test.yml .config/
```

2. Start DB and Redis servers for testing:
```sh
docker compose -f packages/backend/test/compose.yml up
```
Instead, you can prepare an empty (data can be erased) DB and edit `.config/test.yml` appropriately.

3. Run all tests:
```sh
pnpm --filter backend test     # unit tests
pnpm --filter backend test:e2e # single-server E2E tests
```
If you want to run a specific test, run as a following command:
```sh
pnpm --filter backend test -- packages/backend/test/unit/activitypub.ts
pnpm --filter backend test:e2e -- packages/backend/test/e2e/nodeinfo.ts
```

### Running Multiple-server E2E Tests
See [`/packages/backend/test-federation/README.md`](/packages/backend/test-federation/README.md).

## Continuous integration
Misskey uses GitHub Actions for executing automated tests.
Configuration files are located in [`/.github/workflows`](/.github/workflows).
