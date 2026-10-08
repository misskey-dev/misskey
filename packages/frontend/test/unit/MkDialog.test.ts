/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/vue';
import { components } from '@/components/index.js';
import { directives } from '@/directives/index.js';
import MkDialog from '@/components/MkDialog.vue';

describe('MkDialog datetime-local input with min', () => {
	// min = 2030-01-01 12:00 (ローカル時刻)
	const min = new Date(2030, 0, 1, 12, 0);

	const renderDialog = (defaultValue: string | null) => {
		return render(MkDialog, {
			props: {
				input: { type: 'datetime-local', default: defaultValue, min },
			},
			global: {
				directives,
				components,
				// MkModal は teleport / transition を使うので、スロットをそのまま描画するだけのスタブに差し替える
				stubs: { MkModal: { template: '<div><slot/></div>' }, Mfm: true },
			},
		});
	};

	afterEach(() => {
		cleanup();
	});

	test('min is passed to the input element as a local datetime string', () => {
		const { container } = renderDialog(null);
		const input = container.querySelector('input');
		assert.strictEqual(input?.getAttribute('min'), '2030-01-01T12:00');
	});

	test('OK is disabled when the entered datetime is before min', async () => {
		const { getByTestId, container } = renderDialog('2030-01-01T11:59');
		assert.ok((getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);
		assert.ok(container.textContent?.includes('指定できません'));
	});

	test('OK is disabled after typing a past datetime', async () => {
		const { getByTestId, container } = renderDialog('2030-01-01T12:00');
		assert.ok(!(getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);

		const input = container.querySelector('input')!;
		await fireEvent.update(input, '2020-01-01T00:00');
		assert.ok((getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);
	});

	test('OK is disabled when no datetime is entered', async () => {
		const { getByTestId, container } = renderDialog(null);
		assert.ok((getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);

		const input = container.querySelector('input')!;
		await fireEvent.update(input, '2030-01-01T12:00');
		assert.ok(!(getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);
		await fireEvent.update(input, '');
		assert.ok((getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);
	});

	test('OK is enabled when the entered datetime is equal to or after min', () => {
		const { getByTestId } = renderDialog('2030-01-01T12:00');
		assert.ok(!(getByTestId('modal-dialog-ok') as HTMLButtonElement).disabled);
	});
});
