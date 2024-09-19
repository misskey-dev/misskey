Execute following commands:
```sh
cp ./.env.example ./.env
bash ./generate_certificates.sh
pnpm build:fed
docker compose up
```
