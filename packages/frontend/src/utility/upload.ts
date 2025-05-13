/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { apiUrl } from '@@/js/config.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

export function uploadFile(file: File | Blob, options: {
	name?: string;
	folderId?: string | null;
	onProgress?: (ctx: { total: number; loaded: number; }) => void;
} = {}): Promise<Misskey.entities.DriveFile> {
	return new Promise((resolve, reject) => {
		if ($i == null) return reject();

		if ((file.size > instance.maxFileSize) || (file.size > ($i.policies.maxFileSizeMb * 1024 * 1024))) {
			os.alert({
				type: 'error',
				title: i18n.ts.failedToUpload,
				text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
			});
			return reject();
		}

		const xhr = new XMLHttpRequest();
		xhr.open('POST', apiUrl + '/drive/files/create', true);
		xhr.onload = ((ev: ProgressEvent<XMLHttpRequest>) => {
			if (xhr.status !== 200 || ev.target == null || ev.target.response == null) {
				if (xhr.status === 413) {
					os.alert({
						type: 'error',
						title: i18n.ts.failedToUpload,
						text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
					});
				} else if (ev.target?.response) {
					const res = JSON.parse(ev.target.response);
					if (res.error?.id === 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2') {
						os.alert({
							type: 'error',
							title: i18n.ts.failedToUpload,
							text: i18n.ts.cannotUploadBecauseInappropriate,
						});
					} else if (res.error?.id === 'd08dbc37-a6a9-463a-8c47-96c32ab5f064') {
						os.alert({
							type: 'error',
							title: i18n.ts.failedToUpload,
							text: i18n.ts.cannotUploadBecauseNoFreeSpace,
						});
					} else {
						os.alert({
							type: 'error',
							title: i18n.ts.failedToUpload,
							text: `${res.error?.message}\n${res.error?.code}\n${res.error?.id}`,
						});
					}
				} else {
					os.alert({
						type: 'error',
						title: 'Failed to upload',
						text: `${JSON.stringify(ev.target?.response)}, ${JSON.stringify(xhr.response)}`,
					});
				}

				reject();
				return;
			}

			const driveFile = JSON.parse(ev.target.response);
			resolve(driveFile);
		}) as (ev: ProgressEvent<EventTarget>) => any;

		if (options.onProgress) {
			xhr.upload.onprogress = ev => {
				if (ev.lengthComputable) {
					options.onProgress({
						total: ev.total,
						loaded: ev.loaded,
					});
				}
			};
		}

		const formData = new FormData();
		formData.append('i', $i.token);
		formData.append('force', 'true');
		formData.append('file', file);
		formData.append('name', options.name ?? file.name ?? 'untitled');
		if (options.folderId) formData.append('folderId', options.folderId);

		xhr.send(formData);
	});
}
