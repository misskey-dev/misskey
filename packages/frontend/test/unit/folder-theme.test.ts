/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, it, vi } from 'vitest';
import { render } from '@testing-library/vue';
import MkFolder from '@/components/MkFolder.vue';

vi.mock('@/theme.js', () => ({ themeManager: { currentCompiledTheme: null } }));
vi.mock('@/os.js', () => ({ pageFolderTeleportCount: { value: 0 }, popup: vi.fn() }));
vi.mock('@/components/MkFolderPage.vue', () => ({ default: { template: '<div />' } }));

it('renders a closed folder before a compiled theme is available', () => {
	const { getByRole } = render(MkFolder, {
		props: { canPage: false },
		slots: { label: 'Details' },
		global: { stubs: {
			MkStickyContainer: { template: '<div><slot name="header" /><slot /></div>' },
			MkCondensedLine: { template: '<div><slot /></div>' },
		} },
	});
	expect(getByRole('button').textContent).toContain('Details');
});
