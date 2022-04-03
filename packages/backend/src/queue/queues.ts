import config from '@/config/index.js';
import { initialize as initializeQueue } from './initialize.js';
import { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData, EndedPollNotificationJobData, WebhookDeliverJobData } from './types.js';

export const systemQueue = initializeQueue<Record<string, unknown>>('system');
export const endedPollNotificationQueue = initializeQueue<EndedPollNotificationJobData>('endedPollNotification');
export const deliverQueue = initializeQueue<DeliverJobData>('deliver', config.deliverJobPerSec || 128);
export const inboxQueue = initializeQueue<InboxJobData>('inbox', config.inboxJobPerSec || 16);
export const dbQueue = initializeQueue<DbJobData>('db');
export const objectStorageQueue = initializeQueue<ObjectStorageJobData>('objectStorage');
export const webhookDeliverQueue = initializeQueue<WebhookDeliverJobData>('webhookDeliver', 64);

export const queues = [
	systemQueue,
	endedPollNotificationQueue,
	deliverQueue,
	inboxQueue,
	dbQueue,
	objectStorageQueue,
	webhookDeliverQueue,
];
