import * as Deque from 'double-ended-queue';
import Xev from 'xev';
import { deliverQueue, inboxQueue } from '../queue';

const ev = new Xev();

const interval = 2000;

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

	deliverQueue.on('global:active', () => {
		activeDeliverJobs++;
	});

	inboxQueue.on('global:active', () => {
		activeInboxJobs++;
	});

	async function tick() {
		const deliverJobCounts = await deliverQueue.getJobCounts();
		const inboxJobCounts = await inboxQueue.getJobCounts();

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
			}
		};

		ev.emit('queueStats', stats);

		log.unshift(stats);
		if (log.length > 200) log.pop();

		activeDeliverJobs = 0;
		activeInboxJobs = 0;
	}

	tick();

	setInterval(tick, interval);
}
