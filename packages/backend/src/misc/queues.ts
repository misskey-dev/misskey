import { EventEmitter } from 'node:events';
import * as Bull from 'bullmq';

export class Queues<DataType = any, ResultType = any, NameType extends string = string> {
	public readonly queues: ReadonlyArray<Bull.Queue<DataType, ResultType, NameType>>;

	constructor(queues: Bull.Queue<DataType, ResultType, NameType>[]) {
		if (queues.length === 0) {
			throw new Error('queues cannot be empty.');
		}
		this.queues = queues;
	}

	getRandomQueue(): Bull.Queue<DataType, ResultType, NameType> {
		return this.queues[Math.floor(Math.random() * this.queues.length)];
	}

	add(name: NameType, data: DataType, opts?: Bull.JobsOptions): Promise<Bull.Job<DataType, ResultType, NameType>> {
		return this.getRandomQueue().add(name, data, opts);
	}

	async addBulk(jobs: { name: NameType; data: DataType; opts?: Bull.BulkJobOptions }[]): Promise<Bull.Job<DataType, ResultType, NameType>[]> {
		return (await Promise.allSettled(jobs.map(job => this.add(job.name, job.data, job.opts))))
			.filter((value): value is PromiseFulfilledResult<Bull.Job<DataType, ResultType, NameType>> => value.status === 'fulfilled')
			.flatMap(value => value.value);
	}

	async close(): Promise<void> {
		await Promise.allSettled(this.queues.map(queue => queue.close()));
	}

	async getDelayed(start?: number, end?: number): Promise<Bull.Job<DataType, ResultType, NameType>[]> {
		return (await Promise.allSettled(this.queues.map(queue => queue.getDelayed(start, end))))
			.filter((value): value is PromiseFulfilledResult<Bull.Job<DataType, ResultType, NameType>[]> => value.status === 'fulfilled')
			.flatMap(value => value.value);
	}

	async getJobCounts(...types: Bull.JobType[]): Promise<{ [p: string]: number }> {
		return (await Promise.allSettled(this.queues.map(queue => queue.getJobCounts(...types))))
			.filter((value): value is PromiseFulfilledResult<Record<string, number>> => value.status === 'fulfilled')
			.reduce((previousValue, currentValue) => {
				for (const key in currentValue.value) {
					previousValue[key] = (previousValue[key] || 0) + currentValue.value[key];
				}
				return previousValue;
			}, {} as Record<string, number>);
	}

	once<U extends keyof Bull.QueueListener<DataType, ResultType, NameType>>(event: U, listener: Bull.QueueListener<DataType, ResultType, NameType>[U]): void {
		const e = new EventEmitter();
		e.once(event, listener);

		const listener1 = (...args: any[]) => e.emit(event, ...args);
		this.queues.forEach(queue => queue.once(event, listener1));
		e.once(event, () => this.queues.forEach(queue => queue.off(event, listener1)));
	}

	async clean(grace: number, limit: number, type?: 'completed' | 'wait' | 'active' | 'paused' | 'prioritized' | 'delayed' | 'failed'): Promise<NameType[]> {
		return (await Promise.allSettled(this.queues.map(queue => queue.clean(grace, limit, type))))
			.filter((value): value is PromiseFulfilledResult<NameType[]> => value.status === 'fulfilled')
			.flatMap(value => value.value);
	}

	async getJobs(types?: Bull.JobType[] | Bull.JobType, start?: number, end?: number, asc?: boolean): Promise<Bull.Job<DataType, ResultType, NameType>[]> {
		return (await Promise.allSettled(this.queues.map(queue => queue.getJobs(types, start, end, asc))))
			.filter((value): value is PromiseFulfilledResult<Bull.Job<DataType, ResultType, NameType>[]> => value.status === 'fulfilled')
			.flatMap(value => value.value);
	}
}
