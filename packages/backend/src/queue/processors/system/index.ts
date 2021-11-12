import * as Bull from 'bull';
import { resyncCharts } from './resync-charts';

const jobs = {
	resyncCharts,
} as Record<string, Bull.ProcessCallbackFunction<Record<string, unknown>> | Bull.ProcessPromiseFunction<Record<string, unknown>>>;

export default function(dbQueue: Bull.Queue<Record<string, unknown>>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
