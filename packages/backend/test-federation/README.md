Execute following commands:
```sh
cp ./.env.example ./.env
bash ./generate_certificates.sh
pnpm build:fed
docker compose up
```

For testing a specific file, run following:
```sh
docker compose run --rm tester -- pnpm -F backend test:fed packages/backend/test-federation/test/user.test.ts
```
