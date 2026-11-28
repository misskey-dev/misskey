/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { ApiCallService } from '@/server/api/ApiCallService.js';
import { meta as reindexMeta, paramDef as reindexParams } from '@/server/api/endpoints/admin/search/reindex.js';
import { meta as resetMeta, paramDef as resetParams } from '@/server/api/endpoints/admin/search/reset.js';
import Logger from '@/logger.js';
import { envOption } from '@/env.js';
import { logManager } from '@/logging/logging-runtime.js';
import { PrettyConsoleBackend } from '@/logging/PrettyConsoleBackend.js';
import type { LogBackend } from '@/logging/LogBackend.js';
import type { LogRecord } from '@/logging/types.js';

/** API失敗ログを確認するための最小Fastify応答を作成します。 */
function createReply() {
	return {
		code: vi.fn(),
		header: vi.fn(),
		send: vi.fn(),
	};
}

/** APIサービスの依存関係を最小限の仮実装へ差し替えます。 */
function createService(auth: [unknown, unknown] = [null, null], roles: unknown[] = []) {
	const authenticateService = {
		authenticate: vi.fn().mockResolvedValue(auth),
	};
	const telemetryService = {
		startSpan: vi.fn((_name: string, callback: () => unknown) => callback()),
		captureMessage: vi.fn(),
	};
	const apiLoggerService = { logger: new Logger('api') };

	const service = new ApiCallService(
		{} as never,
		{} as never,
		{} as never,
		authenticateService as never,
		{} as never,
		{ getUserRoles: vi.fn().mockResolvedValue(roles) } as never,
		apiLoggerService as never,
		telemetryService as never,
	);
	return { service, telemetryService };
}

describe('ApiCallService structured error logging', () => {
	test('redacts API credentials and serializes the endpoint error', async () => {
		const write = vi.fn<LogBackend['write']>();
		logManager.setBackend({ write });
		const previousQuiet = envOption.quiet;
		envOption.quiet = false;
		const { service, telemetryService } = createService();
		try {
			const reply = createReply();
			const endpoint = {
				name: 'notes/show',
				meta: {},
				params: {},
				exec: vi.fn().mockRejectedValue(new TypeError('broken endpoint')),
			};
			const request = {
				method: 'POST',
				body: {
					i: 'native-token',
					password: 'password',
					options: { visible: true },
				},
				query: {},
				headers: {},
				ip: '127.0.0.1',
			};

			await service.handleRequest(endpoint as never, request as never, reply as never);

			const record = write.mock.calls[0][0] as LogRecord;
			expect(record).toMatchObject({
				eventName: 'api.endpoint.failed',
				attributes: {
					'api.endpoint': 'notes/show',
					'api.params': {
						i: '[REDACTED]',
						password: '[REDACTED]',
						options: { visible: true },
					},
				},
				error: { type: 'TypeError', message: 'broken endpoint' },
			});
			expect(record.attributes?.['error.id']).toEqual(expect.any(String));
			expect(telemetryService.captureMessage.mock.calls[0][1].extra).not.toHaveProperty('ps');
		} finally {
			service.dispose();
			envOption.quiet = previousQuiet;
			logManager.setBackend(new PrettyConsoleBackend({ output: () => undefined }));
		}
	});
});

describe.each([
	['admin/search/reindex', reindexMeta, reindexParams],
	['admin/search/reset', resetMeta, resetParams],
] as const)('%s authorization', (name, meta, params) => {
	const user = { id: 'test-user' };
	const request = { method: 'POST', headers: {}, body: {}, ip: '127.0.0.1' };

	test.each([
		{ auth: [null, null], roles: [], status: 400, code: 'ACCESS_DENIED' },
		{ auth: [user, null], roles: [], status: 403, code: 'ROLE_PERMISSION_DENIED' },
		{ auth: [user, null], roles: [{ isModerator: true, isAdministrator: false }], status: 403, code: 'ROLE_PERMISSION_DENIED' },
		{ auth: [user, { permission: [] }], roles: [{ isAdministrator: true }], status: 400, code: 'ACCESS_DENIED' },
	] as const)('管理者アカウントによる認証要件を満たさないリクエストを拒否する（%j）', async ({ auth, roles, status, code }) => {
		const { service } = createService([...auth], [...roles]);
		const reply = createReply();
		const exec = vi.fn();
		try {
			await service.handleRequest({ name, meta, params, exec } as never, request as never, reply as never);
			expect(exec).not.toHaveBeenCalled();
			expect(reply.code).toHaveBeenCalledWith(status);
			expect(reply.send).toHaveBeenCalledWith({ error: expect.objectContaining({ code }) });
		} finally {
			service.dispose();
		}
	});
});
