import os from 'node:os';
import { beforeEach, describe } from '@jest/globals';
import { setCpuCount } from '@/boot/common.js';
import { computeWorkerArguments } from '@/boot/worker.js';
import { Config } from '@/config.js';

describe('worker', () => {
	describe('computeWorkerArguments', () => {
		function createConfig({ clusterLimit, enableJobQueueProcessing, instanceCount }: {
			clusterLimit: number,
			instanceCount: number,
			enableJobQueueProcessing: boolean,
		}): Partial<Config> {
			return {
				clusterLimit,
				cluster: {
					httpServer: {
						instances: instanceCount,
						enableJobQueueProcessing,
					},
				},
			};
		}

		function mockCpuCount(cnt: number) {
			setCpuCount(cnt);
		}

		beforeEach(() => {
			setCpuCount(os.cpus().length);
		});

		describe('enableJobQueueProcessing === true', () => {
			describe('clusterLimit, instanceCount, cpus().lengthによる判定確認', () => {
				test('[clusterLimit === 1, instanceCount === 1, cpus().length === 2] server: false, jobQueue: true', () => {
					mockCpuCount(2);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 1,
						instanceCount: 1,
						enableJobQueueProcessing: true,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[clusterLimit === 2, instanceCount === 1, cpus().length === 2] server: false, jobQueue: true', () => {
					mockCpuCount(2);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 2,
						instanceCount: 1,
						enableJobQueueProcessing: true,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[clusterLimit === 1, instanceCount === 2, cpus().length === 2] server: false, jobQueue: true', () => {
					mockCpuCount(2);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 1,
						instanceCount: 2,
						enableJobQueueProcessing: true,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[clusterLimit === 2, instanceCount === 2, cpus().length === 1] server: false, jobQueue: true', () => {
					mockCpuCount(1);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 2,
						instanceCount: 2,
						enableJobQueueProcessing: true,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[workerIndexによる分岐確認] 0～1はServer+JobQueue、それ以降はjobQueue only', () => {
					mockCpuCount(4);

					const config = createConfig({
						clusterLimit: 4,
						instanceCount: 2,
						enableJobQueueProcessing: true,
					});
					const envs = {};

					const [result1, result2, result3, result4] = Array.from({ length: 4 }, (_, i) => computeWorkerArguments(i, config, envs));

					expect(result1.__moduleServer).toBe(true);
					expect(result1.__moduleJobQueue).toBe(true);
					expect(result2.__moduleServer).toBe(true);
					expect(result2.__moduleJobQueue).toBe(true);
					expect(result3.__moduleServer).toBe(false);
					expect(result3.__moduleJobQueue).toBe(true);
					expect(result4.__moduleServer).toBe(false);
					expect(result4.__moduleJobQueue).toBe(true);
				});
			});
		});

		describe('enableJobQueueProcessing === false', () => {
			describe('clusterLimit, instanceCount, cpus().lengthによる判定確認', () => {
				test('[clusterLimit === 1, instanceCount === 1, cpus().length === 2] server: false, jobQueue: true', () => {
					mockCpuCount(2);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 1,
						instanceCount: 1,
						enableJobQueueProcessing: false,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[clusterLimit === 2, instanceCount === 1, cpus().length === 2] server: false, jobQueue: true', () => {
					mockCpuCount(2);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 2,
						instanceCount: 1,
						enableJobQueueProcessing: false,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[clusterLimit === 1, instanceCount === 2, cpus().length === 2] server: false, jobQueue: true', () => {
					mockCpuCount(2);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 1,
						instanceCount: 2,
						enableJobQueueProcessing: false,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[clusterLimit === 2, instanceCount === 2, cpus().length === 1] server: false, jobQueue: true', () => {
					mockCpuCount(1);

					const workerIndex = 0;
					const config = createConfig({
						clusterLimit: 2,
						instanceCount: 2,
						enableJobQueueProcessing: false,
					});
					const envs = {};

					const result = computeWorkerArguments(workerIndex, config, envs);

					expect(result.__moduleServer).toBe(false);
					expect(result.__moduleJobQueue).toBe(true);
				});

				test('[workerIndexによる分岐確認] 0～1はServer only、それ以降はjobQueue only', () => {
					mockCpuCount(4);

					const config = createConfig({
						clusterLimit: 4,
						instanceCount: 2,
						enableJobQueueProcessing: false,
					});
					const envs = {};

					const [result1, result2, result3, result4] = Array.from({ length: 4 }, (_, i) => computeWorkerArguments(i, config, envs));

					expect(result1.__moduleServer).toBe(true);
					expect(result1.__moduleJobQueue).toBe(false);
					expect(result2.__moduleServer).toBe(true);
					expect(result2.__moduleJobQueue).toBe(false);
					expect(result3.__moduleServer).toBe(false);
					expect(result3.__moduleJobQueue).toBe(true);
					expect(result4.__moduleServer).toBe(false);
					expect(result4.__moduleJobQueue).toBe(true);
				});
			});
		});

		describe('onlyServer, onlyQueueによる判定確認', () => {
			test('[onlyServer === true] server: true, jobQueue: false', () => {
				mockCpuCount(2);

				const workerIndex = 0;
				const config = createConfig({
					clusterLimit: 2,
					instanceCount: 2,
					enableJobQueueProcessing: true,
				});
				const envs = { onlyServer: true };

				const result = computeWorkerArguments(workerIndex, config, envs);

				expect(result.__moduleServer).toBe(true);
				expect(result.__moduleJobQueue).toBe(false);
			});

			test('[onlyQueue === true] server: false, jobQueue: true', () => {
				const workerIndex = 0;
				const config = createConfig({
					clusterLimit: 2,
					instanceCount: 2,
					enableJobQueueProcessing: true,
				});
				const envs = { onlyQueue: true };

				const result = computeWorkerArguments(workerIndex, config, envs);

				expect(result.__moduleServer).toBe(false);
				expect(result.__moduleJobQueue).toBe(true);
			});

			test('[onlyQueue === true, onlyServer === true] Error', () => {
				const workerIndex = 0;
				const config = createConfig({
					clusterLimit: 2,
					instanceCount: 2,
					enableJobQueueProcessing: true,
				});
				const envs = { onlyServer: true, onlyQueue: true };

				expect(() => computeWorkerArguments(workerIndex, config, envs))
					.toThrow('Cannot specify both onlyQueue and onlyServer');
			});
		});
	});
});
