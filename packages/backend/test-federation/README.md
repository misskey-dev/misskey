## test-federation
Test federation between two Misskey servers: `a.test` and `b.test`.

First, you need to start servers by executing following commands:
```sh
cp ./.config/example.docker.env ./.config/docker.env
bash ./generate_certificates.sh
docker compose up --scale tester=0
```

Then you can run all tests by a following command:
```sh
docker compose run --rm tester
```

For testing a specific file, run a following command:
```sh
docker compose run --rm tester -- pnpm -F backend test:fed packages/backend/test-federation/test/user.test.ts
```
