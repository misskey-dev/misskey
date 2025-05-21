/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import { apiUrl } from '@@/js/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { globalEvents } from '@/events.js';
import { getProxiedImageUrl } from '@/utility/media-proxy.js';

type UploadReturnType = {
	filePromise: Promise<Misskey.entities.DriveFile>;
	abort: () => void;
};

export class UploadAbortedError extends Error {
	constructor() {
		super('Upload aborted');
	}
}

export function uploadFile(file: File | Blob, options: {
	name?: string;
	folderId?: string | null;
	onProgress?: (ctx: { total: number; loaded: number; }) => void;
} = {}): UploadReturnType {
	const xhr = new XMLHttpRequest();
	const abortController = new AbortController();
	const { signal } = abortController;

	const filePromise = new Promise<Misskey.entities.DriveFile>((resolve, reject) => {
		if ($i == null) return reject();

		if ((file.size > instance.maxFileSize) || (file.size > ($i.policies.maxFileSizeMb * 1024 * 1024))) {
			os.alert({
				type: 'error',
				title: i18n.ts.failedToUpload,
				text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
			});
			return reject();
		}

		signal.addEventListener('abort', () => {
			reject(new UploadAbortedError());
		}, { once: true });

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
			globalEvents.emit('driveFileCreated', driveFile);
			resolve(driveFile);
		}) as (ev: ProgressEvent<EventTarget>) => any;

		if (options.onProgress) {
			xhr.upload.onprogress = ev => {
				if (ev.lengthComputable && options.onProgress != null) {
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
		formData.append('name', options.name ?? (file instanceof File ? file.name : 'untitled'));
		if (options.folderId) formData.append('folderId', options.folderId);

		xhr.send(formData);
	});

	const abort = () => {
		xhr.abort();
		abortController.abort();
	};

	return { filePromise, abort };
}

export function chooseFileFromPcAndUpload(
	options: {
		multiple?: boolean;
		folderId?: string | null;
	} = {},
): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		os.chooseFileFromPc({ multiple: options.multiple }).then(files => {
			if (files.length === 0) return;
			os.launchUploader(files, {
				folderId: options.folderId,
			}).then(driveFiles => {
				res(driveFiles);
			});
		});
	});
}

export function chooseDriveFile(options: {
	multiple?: boolean;
} = {}): Promise<Misskey.entities.DriveFile[]> {
	return new Promise(resolve => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkDriveFileSelectDialog.vue')), {
			multiple: options.multiple ?? false,
		}, {
			done: files => {
				if (files) {
					resolve(files);
				}
			},
			closed: () => dispose(),
		});
	});
}

export function chooseFileFromUrl(): Promise<Misskey.entities.DriveFile> {
	return new Promise((res, rej) => {
		os.inputText({
			title: i18n.ts.uploadFromUrl,
			type: 'url',
			placeholder: i18n.ts.uploadFromUrlDescription,
		}).then(({ canceled, result: url }) => {
			if (canceled) return;

			const marker = Math.random().toString(); // TODO: UUIDとか使う

			// TODO: no websocketモード対応
			const connection = useStream().useChannel('main');
			connection.on('urlUploadFinished', urlResponse => {
				if (urlResponse.marker === marker) {
					res(urlResponse.file);
					connection.dispose();
				}
			});

			misskeyApi('drive/files/upload-from-url', {
				url: url,
				folderId: prefer.s.uploadFolder,
				marker,
			});

			os.alert({
				title: i18n.ts.uploadFromUrlRequested,
				text: i18n.ts.uploadFromUrlMayTakeTime,
			});
		});
	});
}

function select(src: HTMLElement | EventTarget | null, label: string | null, multiple: boolean): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		os.popupMenu([label ? {
			text: label,
			type: 'label',
		} : undefined, {
			text: i18n.ts.upload,
			icon: 'ti ti-upload',
			action: () => chooseFileFromPcAndUpload({ multiple }).then(files => res(files)),
		}, {
			text: i18n.ts.fromDrive,
			icon: 'ti ti-cloud',
			action: () => chooseDriveFile({ multiple }).then(files => res(files)),
		}, {
			text: i18n.ts.fromUrl,
			icon: 'ti ti-link',
			action: () => chooseFileFromUrl().then(file => res([file])),
		}], src);
	});
}

export function selectFile(src: HTMLElement | EventTarget | null, label: string | null = null): Promise<Misskey.entities.DriveFile> {
	return select(src, label, false).then(files => files[0]);
}

export function selectFiles(src: HTMLElement | EventTarget | null, label: string | null = null): Promise<Misskey.entities.DriveFile[]> {
	return select(src, label, true);
}

export async function createCroppedImageDriveFileFromImageDriveFile(imageDriveFile: Misskey.entities.DriveFile, options: {
	aspectRatio: number | null;
}): Promise<Misskey.entities.DriveFile> {
	return new Promise((resolve, reject) => {
		const imgUrl = getProxiedImageUrl(imageDriveFile.url, undefined, true);
		const image = new Image();
		image.src = imgUrl;
		image.onload = () => {
			const canvas = window.document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0);
			canvas.toBlob(blob => {
				if (blob == null) {
					reject();
					return;
				}

				os.cropImageFile(blob, {
					aspectRatio: options.aspectRatio,
				}).then(croppedImageFile => {
					const { filePromise } = uploadFile(croppedImageFile, {
						name: imageDriveFile.name,
						folderId: imageDriveFile.folderId,
					});

					filePromise.then(driveFile => {
						resolve(driveFile);
					});
				});
			});
		};
	});
}

export async function selectDriveFolder(initialFolder: Misskey.entities.DriveFolder['id'] | null): Promise<Misskey.entities.DriveFolder[]> {
	return new Promise(resolve => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkDriveFolderSelectDialog.vue')), {
			initialFolder,
		}, {
			done: folders => {
				if (folders) {
					resolve(folders);
				}
			},
			closed: () => dispose(),
		});
	});
}
