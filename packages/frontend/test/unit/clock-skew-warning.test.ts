/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, it, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import * as os from '@/os.js';
import ClockSkewWarning from '@/ui/_common_/ClockSkewWarning.vue';
import { clockSkewWarningVisible } from '@/utility/check-clock-skew.js';

vi.mock('@/i18n.js', () => ({ updateI18n: vi.fn(), i18n: { ts: { details: '詳細', menu: 'メニュー', _clockSkewWarning: {
	title: '時刻のずれ', description: '端末とサーバーの時刻にずれがあります。端末の設定を確認してください。設定が正しい場合は、サーバー管理者にご確認ください。', dismiss: 'このタブでは表示しない',
} } } }));

vi.mock('@/os.js', () => ({ alert: vi.fn(async () => {}), popupMenu: vi.fn(async () => {}) }));

beforeEach(() => {
	vi.clearAllMocks();
	sessionStorage.clear();
	clockSkewWarningVisible.value = false;
});

it('shows an accessible banner only after a warning and dismisses it with a button', async () => {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const app = createApp(ClockSkewWarning);
	try {
		app.mount(container);
		expect(container.querySelector('[role="status"]')).toBeNull();
		clockSkewWarningVisible.value = true;
		await nextTick();
		expect(container.querySelector('[role="status"]')?.textContent).toContain('時刻のずれ');
		expect(os.alert).not.toHaveBeenCalled();
		const buttons = container.querySelectorAll('button');
		buttons[0].click();
		expect(os.alert).toHaveBeenCalledExactlyOnceWith({ type: 'warning', title: '時刻のずれ', text: '端末とサーバーの時刻にずれがあります。端末の設定を確認してください。設定が正しい場合は、サーバー管理者にご確認ください。' });
		expect(clockSkewWarningVisible.value).toBe(true);
		buttons[1].click();
		await nextTick();
		expect(container.querySelector('[role="status"]')).toBeNull();
		expect(sessionStorage.getItem('clockSkewWarningDismissed')).toBe('1');
	} finally {
		app.unmount();
		container.remove();
	}
});

it('opens a mobile menu anchored to the button and dismisses through its action', async () => {
	const container = document.createElement('div');
	const app = createApp(ClockSkewWarning);
	clockSkewWarningVisible.value = true;
	try {
		app.mount(container);
		const button = container.querySelector<HTMLButtonElement>('[aria-label="メニュー"]')!;
		button.click();
		expect(os.popupMenu).toHaveBeenCalledWith([expect.objectContaining({ text: 'このタブでは表示しない', action: expect.any(Function) })], button);
		const item = vi.mocked(os.popupMenu).mock.calls[0][0][0];
		if (item && typeof item !== 'string' && 'action' in item) item.action!(new PointerEvent('click'));
		await nextTick();
		expect(clockSkewWarningVisible.value).toBe(false);
		expect(sessionStorage.getItem('clockSkewWarningDismissed')).toBe('1');
	} finally {
		app.unmount();
	}
});
