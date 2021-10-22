import * as Bull from 'bull';
import { resyncCharts } from './resync-charts';

const jobs = {
	resyncCharts,
} as Record<string, Bull.ProcessCallbackFunction<{}> | Bull.ProcessPromiseFunction<{}>>;

export default function(dbQueue: Bull.Queue<{}>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
