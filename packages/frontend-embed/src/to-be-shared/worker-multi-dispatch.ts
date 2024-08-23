/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

function defaultUseWorkerNumber(prev: number, totalWorkers: number) {
	return prev + 1;
}

export class WorkerMultiDispatch<POST = any, RETURN = any> {
	private symbol = Symbol('WorkerMultiDispatch');
	private workers: Worker[] = [];
	private terminated = false;
	private prevWorkerNumber = 0;
	private getUseWorkerNumber = defaultUseWorkerNumber;
	private finalizationRegistry: FinalizationRegistry<symbol>;

	constructor(workerConstructor: () => Worker, concurrency: number, getUseWorkerNumber = defaultUseWorkerNumber) {
		this.getUseWorkerNumber = getUseWorkerNumber;
		for (let i = 0; i < concurrency; i++) {
			this.workers.push(workerConstructor());
		}

		this.finalizationRegistry = new FinalizationRegistry(() => {
			this.terminate();
		});
		this.finalizationRegistry.register(this, this.symbol);

		if (_DEV_) console.log('WorkerMultiDispatch: Created', this);
	}

	public postMessage(message: POST, options?: Transferable[] | StructuredSerializeOptions, useWorkerNumber: typeof defaultUseWorkerNumber = this.getUseWorkerNumber) {
		let workerNumber = useWorkerNumber(this.prevWorkerNumber, this.workers.length);
		workerNumber = Math.abs(Math.round(workerNumber)) % this.workers.length;
		if (_DEV_) console.log('WorkerMultiDispatch: Posting message to worker', workerNumber, useWorkerNumber);
		this.prevWorkerNumber = workerNumber;

		// 不毛だがunionをoverloadに突っ込めない
		// https://stackoverflow.com/questions/66507585/overload-signatures-union-types-and-no-overload-matches-this-call-error
		// https://github.com/microsoft/TypeScript/issues/14107
		if (Array.isArray(options)) {
			this.workers[workerNumber].postMessage(message, options);
		} else {
			this.workers[workerNumber].postMessage(message, options);
		}
		return workerNumber;
	}

	public addListener(callback: (this: Worker, ev: MessageEvent<RETURN>) => any, options?: boolean | AddEventListenerOptions) {
		this.workers.forEach(worker => {
			worker.addEventListener('message', callback, options);
		});
	}

	public removeListener(callback: (this: Worker, ev: MessageEvent<RETURN>) => any, options?: boolean | AddEventListenerOptions) {
		this.workers.forEach(worker => {
			worker.removeEventListener('message', callback, options);
		});
	}

	public terminate() {
		this.terminated = true;
		if (_DEV_) console.log('WorkerMultiDispatch: Terminating', this);
		this.workers.forEach(worker => {
			worker.terminate();
		});
		this.workers = [];
		this.finalizationRegistry.unregister(this);
	}

	public isTerminated() {
		return this.terminated;
	}

	public getWorkers() {
		return this.workers;
	}

	public getSymbol() {
		return this.symbol;
	}
}
