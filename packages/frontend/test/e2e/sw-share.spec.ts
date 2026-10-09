/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

let server: Server;
let foreignServer: Server;
let origin: string;
let foreignOrigin: string;

async function listen(instance: Server) {
	await new Promise<void>(done => instance.listen(0, '127.0.0.1', done));
	return `http://127.0.0.1:${(instance.address() as AddressInfo).port}`;
}

test.beforeAll(async () => {
	const worker = await readFile(resolve(import.meta.dirname, '../../../../built/_sw_dist_/sw.js'));
	const client = await build({
		entryPoints: [resolve(import.meta.dirname, '../../../frontend-shared/js/shared-files.ts')],
		bundle: true, format: 'esm', write: false,
	});
	server = createServer((req, res) => {
		const path = req.url?.split('?')[0];
		res.setHeader('content-type', path?.endsWith('.js') ? 'text/javascript' : 'text/html');
		res.end(path === '/sw.js' ? worker : path === '/shared-files.js' ? client.outputFiles[0].text
			: '<!doctype html><form action="/sw/share" method="post" enctype="multipart/form-data"><input type="file" name="files"><input name="text" value="Shared text"><button>Share</button></form>');
	});
	origin = await listen(server);
	foreignServer = createServer((_req, res) => {
		res.setHeader('content-type', 'text/html');
		res.end(`<!doctype html><form action="${origin}/sw/share" method="post" enctype="multipart/form-data"><input name="text" value="Foreign"><button>Share</button></form>`);
	});
	foreignOrigin = await listen(foreignServer);
});

test.afterAll(async () => {
	await Promise.all([server, foreignServer].filter(Boolean).map(instance => new Promise<void>(done => instance.close(() => done()))));
});

async function read(page: Page, id: string | null, accountId: string) {
	return await page.evaluate(async ({ origin, id, accountId }) => {
		const shared = await import(`${origin}/shared-files.js`);
		const files: File[] = await shared.readSharedFiles(id, accountId);
		return await Promise.all(files.map(async file => ({ name: file.name, text: await file.text() })));
	}, { origin, id, accountId });
}

test('shared drafts remain isolated across requests and accounts', async ({ page, context }) => {
	await page.goto(origin);
	await page.evaluate(async () => {
		await navigator.serviceWorker.register('/sw.js', { type: 'module' });
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) await new Promise<void>(done => navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true }));
	});
	const second = await context.newPage();
	await second.goto(origin);
	await page.locator('input[type=file]').setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('A') });
	await second.locator('input[type=file]').setInputFiles({ name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('B') });
	await Promise.all([page.waitForURL('**/share?**'), second.waitForURL('**/share?**'), page.locator('button').click(), second.locator('button').click()]);
	const firstId = new URL(page.url()).searchParams.get('shareId');
	const secondId = new URL(second.url()).searchParams.get('shareId');
	expect(firstId).toBeTruthy();
	expect(secondId).not.toBe(firstId);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);
	expect(await read(second, secondId, 'B')).toEqual([{ name: 'b.txt', text: 'B' }]);
	expect(await read(second, firstId, 'B')).toEqual([]);
	expect(await read(second, null, 'B')).toEqual([]);
	await page.reload();
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);
	const unclaimedId = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		return await shared.saveSharedFiles([new File(['claim'], 'claim.txt')]);
	}, origin);
	const claims = await Promise.all([read(page, unclaimedId, 'A'), read(second, unclaimedId, 'B')]);
	expect(claims.filter(files => files.length !== 0)).toHaveLength(1);

	const third = await context.newPage();
	await third.goto(origin);
	await third.locator('input[type=file]').evaluate(element => element.remove());
	await Promise.all([third.waitForURL('**/share?**'), third.locator('button').click()]);
	expect(await read(third, new URL(third.url()).searchParams.get('shareId'), 'A')).toEqual([]);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);
	await second.evaluate(async ({ origin, secondId }) => {
		const shared = await import(`${origin}/shared-files.js`);
		await shared.discardSharedFiles(secondId, 'B');
	}, { origin, secondId });
	expect(await read(second, secondId, 'B')).toEqual([]);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);

	await third.goto(foreignOrigin);
	const rejected = third.waitForResponse(response => response.url() === `${origin}/sw/share` && response.request().method() === 'POST');
	await third.locator('button').click();
	expect((await rejected).status()).toBe(403);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);

	const countRecords = () => page.evaluate(() => new Promise<number>((done, reject) => {
		const open = indexedDB.open('misskey-shared-files');
		open.onerror = () => reject(open.error);
		open.onsuccess = () => {
			const db = open.result;
			const count = db.transaction('shares').objectStore('shares').count();
			count.onerror = () => { db.close(); reject(count.error); };
			count.onsuccess = () => { db.close(); done(count.result); };
		};
	}));
	const pendingCount = await countRecords();
	for (let i = 0; i < 3; i++) {
		const opaque = await context.newPage();
		await opaque.goto(origin);
		const target = `${origin}/sw/share?shareId=${firstId}`;
		await opaque.evaluate(({ target, firstId }) => {
			const iframe = document.createElement('iframe');
			iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-top-navigation');
			iframe.srcdoc = `<form action="${target}" method="post" enctype="multipart/form-data" target="_top"><input name="shareId" value="${firstId}"><button>Share</button></form>`;
			document.body.append(iframe);
		}, { target, firstId });
		const submitted = opaque.waitForRequest(request => request.url() === target && request.method() === 'POST');
		await Promise.all([opaque.waitForURL(`${origin}/share`), opaque.frameLocator('iframe').locator('button').click()]);
		expect((await submitted).headers().origin).toBe('null');
		expect(new URL(opaque.url()).searchParams.has('shareId')).toBe(false);
		await opaque.close();
	}
	expect(await countRecords()).toBe(pendingCount);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);

	await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const now = Date.now;
		Date.now = () => now() + 2 * 60 * 60 * 1000;
		try { await shared.cleanupSharedFiles(); } finally { Date.now = now; }
	}, origin);
	expect(await read(page, firstId, 'A')).toEqual([]);
	const capacity = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const attempts = await Promise.allSettled(Array.from({ length: 40 }, () => shared.saveSharedFiles([new File(['x'], 'x.txt')])));
		return { saved: attempts.filter(result => result.status === 'fulfilled').length, rejected: attempts.filter(result => result.status === 'rejected').length };
	}, origin);
	expect(capacity).toEqual({ saved: 32, rejected: 8 });
	expect(await countRecords()).toBe(32);
});
