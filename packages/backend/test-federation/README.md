## test-federation
Test federation between two Misskey servers: `a.test` and `b.test`.

Before testing, you need to build the entire project, and change working directory to here:
```sh
pnpm build
cd packages/backend/test-federation
```

First, you need to start servers by executing following commands:
```sh
bash ./setup.sh
docker compose up --scale tester=0
```

Then you can run all tests by a following command:
```sh
docker compose run --no-deps --rm tester
```

For testing a specific file, run a following command:
```sh
docker compose run --no-deps --rm tester -- pnpm -F backend test:fed packages/backend/test-federation/test/user.test.ts
```
