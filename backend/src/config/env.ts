import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../.env') });

export const port = Number(process.env.PORT ?? 3000);
