import config from '@/config';
import { initialize as initializeQueue } from './initialize';

export const deliverQueue = initializeQueue('deliver', config.deliverJobPerSec || 128);
export const inboxQueue = initializeQueue('inbox', config.inboxJobPerSec || 16);
export const dbQueue = initializeQueue('db');
export const objectStorageQueue = initializeQueue('objectStorage');
