/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { $i, iAmModerator } from '@/i.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import * as os from '@/os.js';
import type { MenuItem } from '@/types/menu.js';

/** 添付ファイルなど、公開ファイル用のメニュー */
export function getFileMenu(file: Misskey.entities.DriveFile, onHideStateUpdated?: (newState: boolean) => void): MenuItem[] {
	const menuItems: MenuItem[] = [];

	if (onHideStateUpdated != null) {
		menuItems.push({
			text: i18n.ts.hide,
			icon: 'ti ti-eye-off',
			action: () => {
				onHideStateUpdated(true);
			},
		});
	}

	if (iAmModerator) {
		menuItems.push({
			text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
			icon: 'ti ti-eye-exclamation',
			danger: true,
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: file.isSensitive ? i18n.ts.unmarkAsSensitiveConfirm : i18n.ts.markAsSensitiveConfirm,
				});

				if (canceled) return;

				os.apiWithDialog('drive/files/update', {
					fileId: file.id,
					isSensitive: !file.isSensitive,
				});
			},
		});
	}

	const details: MenuItem[] = [];
	if ($i?.id === file.userId) {
		details.push({
			type: 'link',
			text: i18n.ts._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${file.id}`,
		});
	}

	if (iAmModerator) {
		details.push({
			type: 'link',
			text: i18n.ts.moderation,
			icon: 'ti ti-photo-exclamation',
			to: `/admin/file/${file.id}`,
		});
	}

	if (details.length > 0) {
		menuItems.push({ type: 'divider' }, ...details);
	}

	if (prefer.s.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: i18n.ts.copyFileId,
			action: () => {
				copyToClipboard(file.id);
			},
		});
	}

	return menuItems;
}
