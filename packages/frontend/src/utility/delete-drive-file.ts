/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { globalEvents } from '@/events.js';

export async function deleteDriveFile(file: Misskey.entities.DriveFile): Promise<boolean> {
	// アイコン/バナーに設定中のファイルは、削除時にサーバー側で設定が解除される (反映は meUpdated イベント経由)
	const isAvatarOrBanner = $i != null && ($i.avatarId === file.id || $i.bannerId === file.id);

	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.tsx.driveFileDeleteConfirmTitle({ name: file.name }),
		text: isAvatarOrBanner
			? i18n.ts.driveFileDeleteConfirmDescriptionWithAvatarOrBanner
			: i18n.ts.driveFileDeleteConfirmDescription,
	});
	if (canceled) return false;

	await os.apiWithDialog('drive/files/delete', {
		fileId: file.id,
	});

	globalEvents.emit('driveFilesDeleted', [file]);

	return true;
}
