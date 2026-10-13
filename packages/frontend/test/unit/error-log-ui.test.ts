/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/vue';
import ErrorLog from '@/pages/settings/error-log.vue';
import { clearClientErrorLogs, clientErrorLogs, recordClientError } from '@/error-log.js';
import * as os from '@/os.js';

vi.mock('@/os.js', () => ({
	confirm: vi.fn(async () => ({ canceled: false })),
	alert: vi.fn(),
	toast: vi.fn(),
}));
vi.mock('@/i18n.js', () => ({
	updateI18n: vi.fn(),
	i18n: { ts: { copy: 'Copy', copiedToClipboard: 'Copied', error: 'Error', _clientErrorLog: {
		copyAll: 'Copy all', deleteAll: 'Delete all', deleteConfirm: 'Delete logs?',
	} } },
}));
vi.mock('@/components/MkButton.vue', () => ({ default: {
	props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>',
} }));

beforeEach(() => {
	cleanup();
	vi.clearAllMocks();
	clearClientErrorLogs();
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => {}) } });
});

function open() {
	return render(ErrorLog, { global: { stubs: { MkTime: true, MkFolder: { template: '<div><slot name="label" /><slot /></div>' } } } });
}

it('disables actions for empty logs and renders, copies and deletes saved logs', async () => {
	const empty = open();
	expect((screen.getByText('Copy all') as HTMLButtonElement).disabled).toBe(true);
	empty.unmount();
	recordClientError('error', 'test error');
	open();
	expect(screen.getByText(/test error/)).toBeTruthy();
	await fireEvent.click(screen.getByText('Copy'));
	await waitFor(() => expect(os.toast).toHaveBeenCalledWith('Copied'));
	expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('test error'));
	await fireEvent.click(screen.getByText('Delete all'));
	await waitFor(() => expect(clientErrorLogs.value).toEqual([]));
});

it('reports failed copies and keeps logs when deletion is canceled', async () => {
	recordClientError('error', 'test error');
	vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('denied'));
	vi.mocked(os.confirm).mockResolvedValueOnce({ canceled: true } as never);
	open();
	await fireEvent.click(screen.getByText('Copy all'));
	await waitFor(() => expect(os.alert).toHaveBeenCalled());
	expect(os.toast).not.toHaveBeenCalled();
	await fireEvent.click(screen.getByText('Delete all'));
	expect(clientErrorLogs.value).toHaveLength(1);
});
