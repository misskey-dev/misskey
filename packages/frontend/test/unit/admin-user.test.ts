/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/vue';
import { Suspense, defineComponent, h } from 'vue';
import { provideMetadataReceiver } from '@/page.js';
import AdminUser from '@/pages/admin-user.vue';

const { saveNote, getUserInfo, showAlert } = vi.hoisted(() => ({
	saveNote: vi.fn(),
	getUserInfo: vi.fn(),
	showAlert: vi.fn(),
}));

vi.mock('@/os.js', async importOriginal => ({
	...await importOriginal<typeof import('@/os.js')>(),
	apiWithDialog: saveNote,
	alert: showAlert,
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
			return getUserInfo();
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
	getUserInfo.mockReset();
	showAlert.mockReset();
});

function renderAdminUser() {
	getUserInfo.mockReturnValue({ moderationNote: 'Saved note', policies: {}, roles: [] });
	return render(defineComponent({
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
}

test('saves a moderation note with 8192 characters including an emoji', async () => {
	const page = renderAdminUser();
	const text = 'a'.repeat(8191) + '😀';

	await fireEvent.update(await page.findByRole('textbox'), text);
	await fireEvent.click(page.getByRole('button', { name: 'Save' }));

	expect(saveNote).toHaveBeenCalledExactlyOnceWith('admin/update-user-note', { userId: 'user123', text });
	expect(showAlert).not.toHaveBeenCalled();
});

test('keeps an overlong moderation note in the editor without saving', async () => {
	const page = renderAdminUser();
	const note = await page.findByRole('textbox');
	const text = 'a'.repeat(8192) + '😀';

	await fireEvent.update(note, text);
	await fireEvent.click(page.getByRole('button', { name: 'Save' }));

	expect(showAlert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'error' }));
	expect(saveNote).not.toHaveBeenCalled();
	expect(note).toHaveProperty('value', text);
});

test('retries a failed moderation note save after switching admin tabs', async () => {
	saveNote.mockRejectedValueOnce(new Error('Save failed'));
	const page = renderAdminUser();

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

test('keeps the latest moderation note when an earlier refresh finishes last', async () => {
	const page = renderAdminUser();
	const note = await page.findByRole('textbox');

	let finishEarlierRefresh!: () => void;
	getUserInfo.mockImplementationOnce(() => new Promise(resolve => {
		finishEarlierRefresh = () => resolve({ moderationNote: 'Earlier note', isModerator: true, policies: {}, roles: [] });
	}));

	await fireEvent.update(note, 'Earlier note');
	await fireEvent.click(page.getByRole('button', { name: 'Save' }));
	await waitFor(() => expect(getUserInfo).toHaveBeenCalledTimes(2));

	getUserInfo.mockResolvedValueOnce({ moderationNote: 'Latest server note', policies: {}, roles: [] });
	await fireEvent.update(note, 'Latest note');
	await fireEvent.click(page.getByRole('button', { name: 'Save' }));
	await waitFor(() => expect(note).toHaveProperty('value', 'Latest server note'));

	finishEarlierRefresh();
	// The earlier response still updates profile details but must keep the saved note.
	await page.findByText('Moderator');
	expect(note).toHaveProperty('value', 'Latest server note');
});
