import * as Deque from 'double-ended-queue';
import Xev from 'xev';
import { deliverQueue, inboxQueue } from '../queue';

const ev = new Xev();

const interval = 1000;

/**
 * Report queue stats regularly
 */
export default function() {
	const log = new Deque<any>();

	ev.on('requestQueueStatsLog', x => {
		ev.emit(`queueStatsLog:${x.id}`, log.toArray().slice(0, x.length || 50));
	});

	async function tick() {
		const deliverJobCounts = await deliverQueue.getJobCounts();
		const inboxJobCounts = await inboxQueue.getJobCounts();

		const stats = {
			deliver: deliverJobCounts,
			inbox: inboxJobCounts
		};

		ev.emit('queueStats', stats);

		log.unshift(stats);
		if (log.length > 200) log.pop();
	}

	tick();

	setInterval(tick, interval);
}
