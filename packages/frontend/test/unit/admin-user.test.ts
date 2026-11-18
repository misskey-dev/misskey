/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/vue';
import { Suspense, defineComponent, h } from 'vue';
import { provideMetadataReceiver } from '@/page.js';
import AdminUser from '@/pages/admin-user.vue';

const { saveNote } = vi.hoisted(() => ({ saveNote: vi.fn() }));

vi.mock('@/os.js', async importOriginal => ({
	...await importOriginal<typeof import('@/os.js')>(),
	apiWithDialog: saveNote,
}));

vi.mock('@/i.js', async importOriginal => ({
	...await importOriginal<typeof import('@/i.js')>(),
	ensureSignin: () => ({ isAdmin: true }),
	iAmAdmin: false,
	iAmModerator: true,
}));

vi.mock('@/utility/misskey-api.js', async importOriginal => ({
	...await importOriginal<typeof import('@/utility/misskey-api.js')>(),
	misskeyApi: async (endpoint: string) => {
		if (endpoint === 'users/show') {
			return { id: 'user123', username: 'testuser', host: null };
		}
		if (endpoint === 'admin/show-user') {
			return { moderationNote: 'Saved note', policies: {}, roles: [] };
		}
		return null;
	},
}));

const PageWithHeader = defineComponent({
	emits: ['update:tab'],
	setup(_, { emit, slots }) {
		return () => h('main', [
			h('button', { onClick: () => emit('update:tab', 'overview') }, 'Overview'),
			h('button', { onClick: () => emit('update:tab', 'roles') }, 'Roles'),
			slots.default?.(),
		]);
	},
});

afterEach(() => {
	cleanup();
	saveNote.mockReset();
});

test('retries a failed moderation note save after switching admin tabs', async () => {
	saveNote.mockRejectedValueOnce(new Error('Save failed'));
	const page = render(defineComponent({
		setup() {
			provideMetadataReceiver(() => {});
			return () => h('div', [h(Suspense, () => h(AdminUser, { userId: 'user123' }))]);
		},
	}), {
		global: {
			components: { PageWithHeader, Mfm: { render: () => null } },
			directives: { adaptiveBorder: () => {}, panel: () => {} },
			stubs: ['MkAvatar', 'MkUserName', 'MkTime', 'FormSection', 'MkKeyValue'],
		},
	});

	await fireEvent.update(await page.findByRole('textbox'), 'Unsaved note');
	await fireEvent.click(page.getByRole('button', { name: 'Save' }));
	await page.findByRole('button', { name: 'Save' });

	await fireEvent.click(page.getByRole('button', { name: 'Roles' }));
	expect(page.queryByRole('textbox')).toBeNull();
	await fireEvent.click(page.getByRole('button', { name: 'Overview' }));
	expect(page.getByRole('textbox')).toHaveProperty('value', 'Unsaved note');

	let rejectRetry!: (error: Error) => void;
	saveNote.mockImplementationOnce(() => new Promise((_, reject) => {
		rejectRetry = reject;
	}));
	await fireEvent.click(page.getByRole('button', { name: 'Save' }));
	expect(saveNote).toHaveBeenNthCalledWith(2, 'admin/update-user-note', {
		userId: 'user123',
		text: 'Unsaved note',
	});

	await fireEvent.click(page.getByRole('button', { name: 'Roles' }));
	await fireEvent.click(page.getByRole('button', { name: 'Overview' }));
	expect(page.queryByRole('button', { name: 'Save' })).toBeNull();

	rejectRetry(new Error('Retry failed'));
	await page.findByRole('button', { name: 'Save' });
});
