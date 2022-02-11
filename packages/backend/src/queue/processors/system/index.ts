import * as Bull from 'bull';
import { tickCharts } from './tick-charts';
import { resyncCharts } from './resync-charts';
import { cleanCharts } from './clean-charts';

const jobs = {
	tickCharts,
	resyncCharts,
	cleanCharts,
} as Record<string, Bull.ProcessCallbackFunction<Record<string, unknown>> | Bull.ProcessPromiseFunction<Record<string, unknown>>>;

export default function(dbQueue: Bull.Queue<Record<string, unknown>>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
