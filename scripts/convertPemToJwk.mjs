import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import rsaPemToJwk from 'rsa-pem-to-jwk';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const privateKey = fs.readFileSync(
    path.join(__dirname, '../certs/private.pem'),
);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars
const jwk = rsaPemToJwk(privateKey, { use: 'sig' }, 'public');
