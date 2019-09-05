import * as Deque from 'double-ended-queue';
import Xev from 'xev';
import { dbQueue, deliverQueue, inboxQueue, objectStorageQueue } from '../queue';

const ev = new Xev();

const interval = 3000;

/**
 * Report queue stats regularly
 */
export default function() {
	const log = new Deque<any>();

	ev.on('requestQueueStatsLog', x => {
		ev.emit(`queueStatsLog:${x.id}`, log.toArray().slice(0, x.length || 50));
	});

	let activeDeliverJobs = 0;
	let activeInboxJobs = 0;
	let activeDbJobs = 0;
	let activeObjectStorageJobs = 0;

	deliverQueue.on('global:active', () => {
		activeDeliverJobs++;
	});

	inboxQueue.on('global:active', () => {
		activeInboxJobs++;
	});

	dbQueue.on('global:active', () => {
		activeDbJobs++;
	});

	objectStorageQueue.on('global:active', () => {
		activeObjectStorageJobs++;
	});

	async function tick() {
		const deliverJobCounts = await deliverQueue.getJobCounts();
		const inboxJobCounts = await inboxQueue.getJobCounts();
		const dbJobCounts = await dbQueue.getJobCounts();
		const objectStorageJobCounts = await objectStorageQueue.getJobCounts();

		const stats = {
			deliver: {
				activeSincePrevTick: activeDeliverJobs,
				active: deliverJobCounts.active,
				waiting: deliverJobCounts.waiting,
				delayed: deliverJobCounts.delayed
			},
			inbox: {
				activeSincePrevTick: activeInboxJobs,
				active: inboxJobCounts.active,
				waiting: inboxJobCounts.waiting,
				delayed: inboxJobCounts.delayed
			},
			db: {
				activeSincePrevTick: activeDbJobs,
				active: dbJobCounts.active,
				waiting: dbJobCounts.waiting,
				delayed: dbJobCounts.delayed
			},
			objectStorage: {
				activeSincePrevTick: activeObjectStorageJobs,
				active: objectStorageJobCounts.active,
				waiting: objectStorageJobCounts.waiting,
				delayed: objectStorageJobCounts.delayed
			},
		};

		ev.emit('queueStats', stats);

		log.unshift(stats);
		if (log.length > 200) log.pop();

		activeDeliverJobs = 0;
		activeInboxJobs = 0;
		activeDbJobs = 0;
		activeObjectStorageJobs = 0;
	}

	tick();

	setInterval(tick, interval);
}
