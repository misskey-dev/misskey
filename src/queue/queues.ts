import config from '@/config';
import { initialize as initializeQueue } from './initialize';
import { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData } from './types';

export const deliverQueue = initializeQueue<DeliverJobData>('deliver', config.deliverJobPerSec || 128);
export const inboxQueue = initializeQueue<InboxJobData>('inbox', config.inboxJobPerSec || 16);
export const dbQueue = initializeQueue<DbJobData>('db');
export const objectStorageQueue = initializeQueue<ObjectStorageJobData>('objectStorage');
