/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test } from '@jest/globals';
import { setCpuCount } from '@/boot/common.js';
import { WorkerArguments } from '@/boot/const.js';
import { computeWorkerArguments } from '@/boot/worker.js';
import { ClusterWorker, Config } from '@/config.js';

describe('worker', () => {
	beforeEach(() => {
		setCpuCount(4);
	});

	describe('computeWorkerArguments', () => {
		function createConfig(cfg: {
			clusterLimit?: number;
			workers?: ClusterWorker[];
		}): Partial<Config> {
			return {
				clusterLimit: cfg.clusterLimit,
				cluster: cfg.workers ? { workers: cfg.workers } : undefined,
			};
		}

		describe('onlyServer, onlyQueueによる判定確認', () => {
			test('onlyServer === trueの時は全部の __moduleServer がtrue', () => {
				const config = createConfig({
					clusterLimit: 4,
				});
				const envs = { onlyServer: true };

				const result = computeWorkerArguments(config, envs);

				expect(result.length).toBe(4);
				for (const r of result) {
					expect(r.__moduleServer).toBe(true);
					expect(r.__moduleJobQueue).toBe(false);
				}
			});

			test('onlyQueue === trueの時は全部の __moduleJobQueue がtrue', () => {
				const config = createConfig({
					clusterLimit: 4,
				});
				const envs = { onlyQueue: true };

				const result = computeWorkerArguments(config, envs);

				expect(result.length).toBe(4);
				for (const r of result) {
					expect(r.__moduleServer).toBe(false);
					expect(r.__moduleJobQueue).toBe(true);
				}
			});

			test('onlyQueue === true, onlyServer === trueの時は不正な設定値としてエラー', () => {
				const config = createConfig({
					clusterLimit: 4,
				});
				const envs = { onlyServer: true, onlyQueue: true };

				expect(() => computeWorkerArguments(config, envs))
					.toThrow('Cannot specify both onlyQueue and onlyServer');
			});
		});

		describe('メインプロセスでHTTPサーバを起動し、全てのワーカープロセスでJobQueueを起動する構成', () => {
			function assertWorkerArguments(actual: WorkerArguments[], clusterLimit: number): void {
				expect(actual.length).toBe(clusterLimit);
				for (let i = 0; i < clusterLimit; i++) {
					expect(actual[i].__moduleServer).toBe(false);
					expect(actual[i].__moduleJobQueue).toBe(true);
				}
			}

			test('clusterLimitが未設定の場合', () => {
				const config = createConfig({});
				const result = computeWorkerArguments(config, {});
				assertWorkerArguments(result, 1);
			});

			test('clusterLimitが1の場合', () => {
				const config = createConfig({
					clusterLimit: 1,
				});
				const result = computeWorkerArguments(config, {});
				assertWorkerArguments(result, 1);
			});

			test('clusterLimitは4だがCPUコア数が1の場合', () => {
				setCpuCount(1);
				const config = createConfig({
					clusterLimit: 4,
				});
				const result = computeWorkerArguments(config, {});
				assertWorkerArguments(result, 1);
			});

			test('cluster.workersが未設定の場合①', () => {
				const config = createConfig({
					clusterLimit: 4,
				});
				const result = computeWorkerArguments(config, {});
				assertWorkerArguments(result, 4);
			});

			test('cluster.workersが未設定の場合②', () => {
				const config = createConfig({
					clusterLimit: 4,
					workers: [],
				});
				const result = computeWorkerArguments(config, {});
				assertWorkerArguments(result, 4);
			});
		});

		describe('cluster.workersに設定された内容に従ってWorkerArgumentsを生成する', () => {
			test('cluster.workersどおりの構成で生成できるか', () => {
				setCpuCount(8);
				const config = createConfig({
					clusterLimit: 8,
					workers: [
						{
							instances: 2,
							type: ['http'],
						}, {
							instances: 4,
							type: ['jobQueue'],
						}, {
							instances: 2,
							type: ['jobQueue', 'http'],
						},
					],
				});

				const result = computeWorkerArguments(config, {});
				expect(result.length).toBe(8);
				expect(result[0].__moduleServer).toBe(true);
				expect(result[0].__moduleJobQueue).toBe(false);
				expect(result[1].__moduleServer).toBe(true);
				expect(result[1].__moduleJobQueue).toBe(false);
				for (let i = 2; i < 6; i++) {
					expect(result[i].__moduleServer).toBe(false);
					expect(result[i].__moduleJobQueue).toBe(true);
				}
				for (let i = 6; i < 8; i++) {
					expect(result[i].__moduleServer).toBe(true);
					expect(result[i].__moduleJobQueue).toBe(true);
				}
			});

			test('clusterLimitに対しcluster.workersの要素数が足りない場合はデフォルト値(jobQueue)で埋める', () => {
				const config = createConfig({
					clusterLimit: 4,
					workers: [{
						name: 'http-server',
						instances: 1,
						type: ['http'],
					}],
				});

				const result = computeWorkerArguments(config, {});
				expect(result.length).toBe(4);
				expect(result[0].__moduleServer).toBe(true);
				expect(result[0].__moduleJobQueue).toBe(false);
				for (let i = 1; i < 3; i++) {
					expect(result[i].__moduleServer).toBe(false);
					expect(result[i].__moduleJobQueue).toBe(true);
				}
			});

			test('cluster.workersの数よりもclusterLimitが少ない場合はエラー', () => {
				const config = createConfig({
					clusterLimit: 2,
					workers: [{
						name: 'http-server',
						instances: 1,
						type: ['http'],
					}, {
						name: 'job-queue',
						instances: 2,
						type: ['jobQueue'],
					}],
				});

				expect(() => computeWorkerArguments(config, {}))
					.toThrow('Too many worker settings');
			});
		});
	});
});
