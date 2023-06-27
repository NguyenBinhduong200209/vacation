import path from 'path';
import { fileURLToPath } from 'url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const publicPath = path.join(__dirname, '..', '..', 'public');
export const resourcePath = path.join(publicPath, 'resource');
