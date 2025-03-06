/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PreferencesProfile } from './profile.js';
import type { MenuItem } from '@/types/menu.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { profileManager } from '@/preferences.js';
import * as os from '@/os.js';

export function getPreferencesProfileMenu(): MenuItem[] {
	return [{
		type: 'label',
		text: profileManager.profile.name || `(${i18n.ts.noName})`,
	}, {
		text: i18n.ts.rename,
		icon: 'ti ti-pencil',
		action: () => {
			renameProfile();
		},
	}, {
		text: i18n.ts.export,
		icon: 'ti ti-download',
		action: () => {
			exportCurrentProfile();
		},
	}, {
		text: i18n.ts.import,
		icon: 'ti ti-upload',
		action: () => {
			importProfile();
		},
	}];
}

async function renameProfile() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.rename,
		placeholder: profileManager.profile.name || null,
		default: profileManager.profile.name || null,
	});
	if (canceled || name == null) return;
	profileManager.renameProfile(name);
}

function exportCurrentProfile() {
	const p = profileManager.profile;
	const txtBlob = new Blob([JSON.stringify(p)], { type: 'text/plain' });
	const dummya = document.createElement('a');
	dummya.href = URL.createObjectURL(txtBlob);
	dummya.download = `${p.name || i18n.ts.untitled}.${p.id}.misskeypreferences`;
	dummya.click();
}

function importProfile() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.misskeypreferences';
	input.onchange = async () => {
		if (input.files == null || input.files.length === 0) return;

		const file = input.files[0];
		const txt = await file.text();
		const profile = JSON.parse(txt) as PreferencesProfile;

		miLocalStorage.setItem('preferences', JSON.stringify(profile));
		location.reload();
	};

	input.click();
}
