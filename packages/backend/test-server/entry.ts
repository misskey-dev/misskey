import { portToPid } from 'pid-port';
import fkill from 'fkill';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { NestFactory } from '@nestjs/core';
import { MainModule } from '@/MainModule.js';
import { ServerService } from '@/server/ServerService.js';
import { loadConfig } from '@/config.js';
import { NestLogger } from '@/NestLogger.js';
import { INestApplicationContext } from '@nestjs/common';

const config = loadConfig();
const originEnv = JSON.stringify(process.env);

process.env.NODE_ENV = 'test';

let app: INestApplicationContext;
let serverService: ServerService;

/**
 * テスト用のサーバインスタンスを起動する
 */
export async function setup() {
	await killTestServer();

	console.log('starting application...');

	app = await NestFactory.createApplicationContext(MainModule, {
		logger: new NestLogger(),
	});
	serverService = app.get(ServerService);
	await serverService.launch();

	await startControllerEndpoints();

	// ジョブキューは必要な時にテストコード側で起動する
	// ジョブキューが動くとテスト結果の確認に支障が出ることがあるので意図的に動かさないでいる

	console.log('application initialized.');
}

/**
 * テスト用のサーバインスタンスを停止する
 */
export async function teardown() {
	await serverService.dispose();
	await app.close();
	await killTestServer();
}

/**
 * 既に重複したポートで待ち受けしているサーバがある場合はkillする
 */
async function killTestServer() {
	//
	try {
		const pid = await portToPid(config.port);
		if (pid) {
			await fkill(pid, { force: true });
		}
	} catch {
		// NOP;
	}
}

/**
 * 別プロセスに切り離してしまったが故に出来なくなった環境変数の書き換え等を実現するためのエンドポイントを作る
 * @param port
 */
async function startControllerEndpoints(port = config.port + 1000) {
	const hono = new Hono();

	hono.post('/env', async (c) => {
		const req = await c.req.json<{ key?: string, value?: string }>();
		console.log(req);
		const key = req['key'];
		if (!key) {
			c.status(400);
			return c.json({ success: false });
		}

		process.env[key] = req['value'];

		c.status(200);
		return c.json({ success: true });
	});

	hono.post('/env-reset', async (c) => {
		process.env = JSON.parse(originEnv);

		await serverService.dispose();
		await app.close();

		await killTestServer();

		console.log('starting application...');

		app = await NestFactory.createApplicationContext(MainModule, {
			logger: new NestLogger(),
		});
		serverService = app.get(ServerService);
		await serverService.launch();

		c.status(200);
		return c.json({ success: true });
	});

	serve({
		fetch: hono.fetch,
		port,
		hostname: 'localhost',
	});
}
