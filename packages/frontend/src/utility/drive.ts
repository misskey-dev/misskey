/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import { apiUrl } from '@@/js/config.js';
import type { UploaderFeatures } from '@/composables/use-uploader.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { globalEvents } from '@/events.js';
import { getProxiedImageUrl } from '@/utility/media-proxy.js';
import { genId } from '@/utility/id.js';

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
	isSensitive?: boolean;
	caption?: string | null;
	onProgress?: (ctx: { total: number; loaded: number; }) => void;
} = {}): UploadReturnType {
	const xhr = new XMLHttpRequest();
	const abortController = new AbortController();
	const { signal } = abortController;

	const filePromise = new Promise<Misskey.entities.DriveFile>((resolve, reject) => {
		if ($i == null) return reject();

		// こっち側で検出するMIME typeとサーバーで検出するMIME typeは異なる場合があるため、こっち側ではやらないことにする
		// https://github.com/misskey-dev/misskey/issues/16091
		//const allowedMimeTypes = $i.policies.uploadableFileTypes;
		//const isAllowedMimeType = allowedMimeTypes.some(mimeType => {
		//	if (mimeType === '*' || mimeType === '*/*') return true;
		//	if (mimeType.endsWith('/*')) return file.type.startsWith(mimeType.slice(0, -1));
		//	return file.type === mimeType;
		//});
		//if (!isAllowedMimeType) {
		//	os.alert({
		//		type: 'error',
		//		title: i18n.ts.failedToUpload,
		//		text: i18n.ts.cannotUploadBecauseUnallowedFileType,
		//	});
		//	return reject();
		//}

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
					} else if (res.error?.id === '4becd248-7f2c-48c4-a9f0-75edc4f9a1ea') {
						os.alert({
							type: 'error',
							title: i18n.ts.failedToUpload,
							text: i18n.ts.cannotUploadBecauseUnallowedFileType,
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
		}) as (ev: ProgressEvent<EventTarget>) => void;

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
		formData.append('isSensitive', options.isSensitive ? 'true' : 'false');
		if (options.caption != null) formData.append('comment', options.caption);
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
		features?: UploaderFeatures;
		folderId?: string | null;
	} = {},
): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		os.chooseFileFromPc({ multiple: options.multiple }).then(files => {
			if (files.length === 0) return;
			os.launchUploader(files, {
				folderId: options.folderId,
				features: options.features,
			}).then(driveFiles => {
				res(driveFiles);
			});
		});
	});
}

export function chooseDriveFile(options: {
	multiple?: boolean;
} = {}): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((resolve, rej) => {
		let dispose: () => void;
		os.popupAsyncWithDialog(import('@/components/MkDriveFileSelectDialog.vue').then(x => x.default), {
			multiple: options.multiple ?? false,
		}, {
			done: files => {
				if (files) {
					resolve(files);
				}
			},
			closed: () => dispose(),
		}).then((d) => dispose = d.dispose, rej);
	});
}

export function chooseFileFromUrl(): Promise<Misskey.entities.DriveFile> {
	return new Promise((res, rej) => {
		os.inputText({
			title: i18n.ts.uploadFromUrl,
			type: 'url',
			placeholder: i18n.ts.uploadFromUrlDescription,
		}).then(({ canceled, result: url }) => {
			if (canceled || url == null) return;

			const marker = genId();

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

function select(anchorElement: HTMLElement | EventTarget | null, label: string | null, multiple: boolean, features?: UploaderFeatures): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		os.popupMenu([label ? {
			text: label,
			type: 'label',
		} : null, {
			text: i18n.ts.upload,
			icon: 'ti ti-upload',
			action: () => chooseFileFromPcAndUpload({ multiple, features }).then(files => res(files)),
		}, {
			text: i18n.ts.fromDrive,
			icon: 'ti ti-cloud',
			action: () => chooseDriveFile({ multiple }).then(files => res(files)),
		}, {
			text: i18n.ts.fromUrl,
			icon: 'ti ti-link',
			action: () => chooseFileFromUrl().then(file => res([file])),
		}], anchorElement);
	});
}

type SelectFileOptions<M extends boolean> = {
	anchorElement: HTMLElement | EventTarget | null;
	multiple: M;
	label?: string | null;
	features?: UploaderFeatures;
};

export async function selectFile<
	M extends boolean,
	MR extends M extends true ? Misskey.entities.DriveFile[] : Misskey.entities.DriveFile,
>(opts: SelectFileOptions<M>): Promise<MR> {
	const files = await select(opts.anchorElement, opts.label ?? null, opts.multiple ?? false, opts.features);
	return opts.multiple ? (files as MR) : (files[0]! as MR);
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

export async function selectDriveFolder(initialFolder: Misskey.entities.DriveFolder['id'] | null): Promise<{
	canceled: false;
	folders: (Misskey.entities.DriveFolder | null)[];
} | {
	canceled: true;
	folders: undefined;
}> {
	return new Promise((resolve, reject) => {
		let dispose: () => void;
		os.popupAsyncWithDialog(import('@/components/MkDriveFolderSelectDialog.vue').then(x => x.default), {
			initialFolder,
		}, {
			done: folders => {
				resolve(folders == null ? {
					canceled: true,
					folders: undefined,
				} : {
					canceled: false,
					folders,
				});
			},
			closed: () => dispose(),
		}).then(d => dispose = d.dispose, reject);
	});
}
