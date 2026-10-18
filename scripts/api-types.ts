// Regenerates src/api/schema.d.ts from the API's OpenAPI spec, so the client's types follow the real API.
// openapi-typescript needs TypeScript 5 while this project uses 6, so it runs through npx with its own copy.
import 'dotenv/config';
import { execSync } from 'node:child_process';

const api = process.env.API_URL ?? 'https://halden-api.vercel.app';
const spec = `${api.replace(/\/$/, '')}/api/v1/docs/openapi.json`;
console.log(`Reading ${spec}`);
execSync(`npx --yes openapi-typescript@7.13.0 "${spec}" -o src/api/schema.d.ts`, { stdio: 'inherit' });
