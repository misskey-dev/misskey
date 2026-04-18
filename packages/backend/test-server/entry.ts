import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { takeCoverage } from 'node:v8';
import { portToPid } from 'pid-port';
import fkill from 'fkill';
import Fastify, { type FastifyInstance } from 'fastify';
import { execaNode, type ResultPromise } from 'execa';
import { NestFactory } from '@nestjs/core';
import { MainModule } from '@/MainModule.js';
import { ServerService } from '@/server/ServerService.js';
import { loadConfig } from '@/config.js';
import { NestLogger } from '@/NestLogger.js';
import { INestApplicationContext } from '@nestjs/common';

const config = loadConfig();
const originEnv = JSON.stringify(process.env);
const entryFilePath = fileURLToPath(import.meta.url);
const controllerPort = config.port + 1000;
const isExecutedDirectly = process.argv[1] != null && entryFilePath === process.argv[1];

process.env.NODE_ENV = 'test';

let app: INestApplicationContext;
let serverService: ServerService;
let controllerServer: FastifyInstance | null = null;
let shutdownPromise: Promise<void> | null = null;

async function flushCoverage() {
	if (process.env.NODE_V8_COVERAGE) {
		takeCoverage();
	}
}

/**
	* テスト用のサーバインスタンスを起動する
 */
async function launchApplication() {
	console.log('starting application...');

	app = await NestFactory.createApplicationContext(MainModule, {
		logger: new NestLogger(),
	});
	serverService = app.get(ServerService);
	await serverService.launch();

	// ジョブキューは必要な時にテストコード側で起動する
	// ジョブキューが動くとテスト結果の確認に支障が出ることがあるので意図的に動かさないでいる

	console.log('application initialized.');
}

async function disposeApplication() {
	await flushCoverage();

	if (serverService) {
		await serverService.dispose();
	}

	if (app) {
		await app.close();
	}
	// @ts-expect-error cleanup for relaunch in the same process
	app = undefined;
	// @ts-expect-error cleanup for relaunch in the same process
	serverService = undefined;
}

async function relaunchApplication() {
	await disposeApplication();
	await launchApplication();
}

/**
 * 既に重複したポートで待ち受けしているサーバがある場合はkillする
 */
async function killServerAtPort(port: number) {
	try {
		const pid = await portToPid(port);
		if (pid) {
			await fkill(pid, { force: true });
		}
	} catch {
		// NOP;
	}
}

async function killTestServers() {
	await Promise.all([
		killServerAtPort(config.port),
		killServerAtPort(controllerPort),
	]);
}

async function shutdownChildProcess() {
	if (shutdownPromise) {
		return shutdownPromise;
	}

	shutdownPromise = (async () => {
		if (controllerServer) {
			await controllerServer.close();
			controllerServer = null;
		}

		await disposeApplication();
	})().finally(() => {
		shutdownPromise = null;
	});

	return shutdownPromise;
}

/**
 * 別プロセスに切り離してしまったが故に出来なくなった環境変数の書き換え等を実現するためのエンドポイントを作る
 * @param port
 */
async function startControllerEndpoints(port = controllerPort) {
	const fastify = Fastify();

	fastify.get('/healthz', async () => {
		return { ok: true };
	});

	fastify.post<{ Body: { key?: string, value?: string } }>('/env', async (req, res) => {
		const key = req.body['key'];
		if (!key) {
			res.code(400).send({ success: false });
			return;
		}

		process.env[key] = req.body['value'];

		res.code(200).send({ success: true });
	});

	fastify.post<{ Body: { key?: string, value?: string } }>('/env-reset', async (req, res) => {
		process.env = JSON.parse(originEnv);
		await relaunchApplication();

		res.code(200).send({ success: true });
	});

	fastify.post('/shutdown', async (_req, res) => {
		res.code(200).send({ success: true });

		setImmediate(() => {
			void shutdownChildProcess().finally(() => {
				process.exit(0);
			});
		});
	});

	await fastify.listen({ port: port, host: 'localhost' });
	controllerServer = fastify;
}

async function runServerProcess() {
	await killTestServers();

	const terminate = async (signal: NodeJS.Signals) => {
		console.log(`received ${signal}, shutting down test server...`);
		await shutdownChildProcess();
		process.exit(0);
	};

	process.on('SIGINT', () => {
		void terminate('SIGINT');
	});
	process.on('SIGTERM', () => {
		void terminate('SIGTERM');
	});

	await launchApplication();
	await startControllerEndpoints();
}

async function waitForControllerReady() {
	for (let attempt = 0; attempt < 120; attempt++) {
		try {
			const response = await fetch(`http://127.0.0.1:${controllerPort}/healthz`);
			if (response.ok) {
				return;
			}
		} catch {
			// NOP
		}

		await delay(500);
	}

	throw new Error('test server did not become ready in time');
}

async function requestChildShutdown() {
	const response = await fetch(`http://127.0.0.1:${controllerPort}/shutdown`, {
		method: 'POST',
		body: JSON.stringify({}),
	});

	if (!response.ok) {
		throw new Error('failed to shut down test server');
	}
}

async function waitForChildExit(child: ResultPromise) {
	await child.catch(() => {
		// NOP
	});
}

function terminateChild(child: ResultPromise, signal: NodeJS.Signals = 'SIGTERM') {
	child.kill(signal);

	const timeout = setTimeout(() => {
		if (!child.killed) {
			child.kill('SIGKILL');
		}
	}, 5000);

	void child.finally(() => {
		clearTimeout(timeout);
	});
}

export default async function globalSetup() {
	await killTestServers();

	const child = execaNode(entryFilePath, [], {
		stdout: process.stdout,
		stderr: process.stderr,
		env: {
			...process.env,
			NODE_ENV: 'test',
		},
	});

	try {
		await waitForControllerReady();
	} catch (error) {
		terminateChild(child);
		throw error;
	}

	return async () => {
		try {
			await requestChildShutdown();
		} catch {
			terminateChild(child);
		}

		await waitForChildExit(child);
	};
}

if (isExecutedDirectly) {
	void runServerProcess().catch((error: unknown) => {
		console.error(error);
		process.exit(1);
	});
}
