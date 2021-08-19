import config from '@/config/index.js';
import { initialize as initializeQueue } from './initialize.js';
import { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData } from './types.js';

export const deliverQueue = initializeQueue<DeliverJobData>('deliver', config.deliverJobPerSec || 128);
export const inboxQueue = initializeQueue<InboxJobData>('inbox', config.inboxJobPerSec || 16);
export const dbQueue = initializeQueue<DbJobData>('db');
export const objectStorageQueue = initializeQueue<ObjectStorageJobData>('objectStorage');
