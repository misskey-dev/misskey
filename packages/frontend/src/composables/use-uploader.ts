/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import isAnimated from 'is-file-animated';
import { EventEmitter } from 'eventemitter3';
import { computed, markRaw, onMounted, onUnmounted, ref, triggerRef } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { genId } from '@/utility/id.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { isWebpSupported } from '@/utility/isWebpSupported.js';
import { uploadFile, UploadAbortedError } from '@/utility/drive.js';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';
import { WatermarkRenderer } from '@/utility/watermark.js';

export type UploaderFeatures = {
	effect?: boolean;
	watermark?: boolean;
	crop?: boolean;
};

const THUMBNAIL_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/svg+xml',
];

const IMAGE_COMPRESSION_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/svg+xml',
];

const CROPPING_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];

const IMAGE_EDITING_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];

const WATERMARK_SUPPORTED_TYPES = IMAGE_EDITING_SUPPORTED_TYPES;

const IMAGE_PREPROCESS_NEEDED_TYPES = [
	...WATERMARK_SUPPORTED_TYPES,
	...IMAGE_COMPRESSION_SUPPORTED_TYPES,
	...CROPPING_SUPPORTED_TYPES,
	...IMAGE_EDITING_SUPPORTED_TYPES,
];

const mimeTypeMap = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png',
} as const;

export type UploaderItem = {
	id: string;
	name: string;
	uploadName?: string;
	progress: { max: number; value: number } | null;
	thumbnail: string | null;
	preprocessing: boolean;
	uploading: boolean;
	uploaded: Misskey.entities.DriveFile | null;
	uploadFailed: boolean;
	aborted: boolean;
	compressionLevel: 0 | 1 | 2 | 3;
	compressedSize?: number | null;
	preprocessedFile?: Blob | null;
	file: File;
	watermarkPresetId: string | null;
	isSensitive?: boolean;
	abort?: (() => void) | null;
};

function getCompressionSettings(level: 0 | 1 | 2 | 3) {
	if (level === 1) {
		return {
			maxWidth: 2000,
			maxHeight: 2000,
		};
	} else if (level === 2) {
		return {
			maxWidth: 2000 * 0.75, // =1500
			maxHeight: 2000 * 0.75, // =1500
		};
	} else if (level === 3) {
		return {
			maxWidth: 2000 * 0.75 * 0.75, // =1125
			maxHeight: 2000 * 0.75 * 0.75, // =1125
		};
	} else {
		return null;
	}
}

export function useUploader(options: {
	folderId?: string | null;
	multiple?: boolean;
	features?: UploaderFeatures;
} = {}) {
	const $i = ensureSignin();

	const events = new EventEmitter<{
		'itemUploaded': (ctx: { item: UploaderItem; }) => void;
	}>();

	const uploaderFeatures = computed<Required<UploaderFeatures>>(() => {
		return {
			effect: options.features?.effect ?? true,
			watermark: options.features?.watermark ?? true,
			crop: options.features?.crop ?? true,
		};
	});

	const items = ref<UploaderItem[]>([]);

	function initializeFile(file: File) {
		const id = genId();
		const filename = file.name ?? 'untitled';
		const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';
		items.value.push({
			id,
			name: prefer.s.keepOriginalFilename ? filename : id + extension,
			progress: null,
			thumbnail: THUMBNAIL_SUPPORTED_TYPES.includes(file.type) ? window.URL.createObjectURL(file) : null,
			preprocessing: false,
			uploading: false,
			aborted: false,
			uploaded: null,
			uploadFailed: false,
			compressionLevel: prefer.s.defaultImageCompressionLevel,
			watermarkPresetId: uploaderFeatures.value.watermark ? prefer.s.defaultWatermarkPresetId : null,
			file: markRaw(file),
		});
		const reactiveItem = items.value.at(-1)!;
		preprocess(reactiveItem).then(() => {
			triggerRef(items);
		});
	}

	function addFiles(newFiles: File[]) {
		for (const file of newFiles) {
			initializeFile(file);
		}
	}

	function removeItem(item: UploaderItem) {
		if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
		items.value.splice(items.value.indexOf(item), 1);
	}

	function getMenu(item: UploaderItem): MenuItem[] {
		const menu: MenuItem[] = [];

		if (
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			menu.push({
				icon: 'ti ti-forms',
				text: i18n.ts.rename,
				action: async () => {
					const { result, canceled } = await os.inputText({
						type: 'text',
						title: i18n.ts.rename,
						placeholder: item.name,
						default: item.name,
					});
					if (canceled) return;
					if (result.trim() === '') return;

					item.name = result;
				},
			}, {
				type: 'switch',
				text: i18n.ts.sensitive,
				icon: 'ti ti-eye-exclamation',
				ref: computed({
					get: () => item.isSensitive ?? false,
					set: (value) => item.isSensitive = value,
				}),
			}, {
				type: 'divider',
			});
		}

		if (
			uploaderFeatures.value.crop &&
			CROPPING_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			menu.push({
				icon: 'ti ti-crop',
				text: i18n.ts.cropImage,
				action: async () => {
					const cropped = await os.cropImageFile(item.file, { aspectRatio: null });
					if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
					items.value.splice(items.value.indexOf(item), 1, {
						...item,
						file: markRaw(cropped),
						thumbnail: window.URL.createObjectURL(cropped),
					});
					const reactiveItem = items.value.find(x => x.id === item.id)!;
					preprocess(reactiveItem).then(() => {
						triggerRef(items);
					});
				},
			});
		}

		if (
			uploaderFeatures.value.effect &&
			IMAGE_EDITING_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			menu.push({
				icon: 'ti ti-sparkles',
				text: i18n.ts._imageEffector.title + ' (BETA)',
				action: async () => {
					const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImageEffectorDialog.vue').then(x => x.default), {
						image: item.file,
					}, {
						ok: (file) => {
							if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
							items.value.splice(items.value.indexOf(item), 1, {
								...item,
								file: markRaw(file),
								thumbnail: window.URL.createObjectURL(file),
							});
							const reactiveItem = items.value.find(x => x.id === item.id)!;
							preprocess(reactiveItem).then(() => {
								triggerRef(items);
							});
						},
						closed: () => dispose(),
					});
				},
			});
		}

		if (
			uploaderFeatures.value.watermark &&
			WATERMARK_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			function changeWatermarkPreset(presetId: string | null) {
				item.watermarkPresetId = presetId;
				preprocess(item).then(() => {
					triggerRef(items);
				});
			}

			menu.push({
				icon: 'ti ti-copyright',
				text: i18n.ts.watermark,
				caption: computed(() => item.watermarkPresetId == null ? null : prefer.s.watermarkPresets.find(p => p.id === item.watermarkPresetId)?.name),
				type: 'parent',
				children: [{
					type: 'radioOption',
					text: i18n.ts.none,
					active: computed(() => item.watermarkPresetId == null),
					action: () => changeWatermarkPreset(null),
				}, {
					type: 'divider',
				}, ...prefer.s.watermarkPresets.map(preset => ({
					type: 'radioOption' as const,
					text: preset.name,
					active: computed(() => item.watermarkPresetId === preset.id),
					action: () => changeWatermarkPreset(preset.id),
				})), ...(prefer.s.watermarkPresets.length > 0 ? [{
					type: 'divider' as const,
				}] : []), {
					type: 'button',
					icon: 'ti ti-plus',
					text: i18n.ts.add,
					action: async () => {
						const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkWatermarkEditorDialog.vue').then(x => x.default), {
							image: item.file,
						}, {
							ok: (preset) => {
								prefer.commit('watermarkPresets', [...prefer.s.watermarkPresets, preset]);
								changeWatermarkPreset(preset.id);
							},
							closed: () => dispose(),
						});
					},
				}],
			});
		}

		if (
			IMAGE_COMPRESSION_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			function changeCompressionLevel(level: 0 | 1 | 2 | 3) {
				item.compressionLevel = level;
				preprocess(item).then(() => {
					triggerRef(items);
				});
			}

			menu.push({
				icon: 'ti ti-leaf',
				text: computed(() => {
					let text = i18n.ts.compress;

					if (item.compressionLevel === 0 || item.compressionLevel == null) {
						text += `: ${i18n.ts.none}`;
					} else if (item.compressionLevel === 1) {
						text += `: ${i18n.ts.low}`;
					} else if (item.compressionLevel === 2) {
						text += `: ${i18n.ts.medium}`;
					} else if (item.compressionLevel === 3) {
						text += `: ${i18n.ts.high}`;
					}

					return text;
				}),
				type: 'parent',
				children: [{
					type: 'radioOption',
					text: i18n.ts.none,
					active: computed(() => item.compressionLevel === 0 || item.compressionLevel == null),
					action: () => changeCompressionLevel(0),
				}, {
					type: 'divider',
				}, {
					type: 'radioOption',
					text: i18n.ts.low,
					active: computed(() => item.compressionLevel === 1),
					action: () => changeCompressionLevel(1),
				}, {
					type: 'radioOption',
					text: i18n.ts.medium,
					active: computed(() => item.compressionLevel === 2),
					action: () => changeCompressionLevel(2),
				}, {
					type: 'radioOption',
					text: i18n.ts.high,
					active: computed(() => item.compressionLevel === 3),
					action: () => changeCompressionLevel(3),
				}],
			});
		}

		if (!item.preprocessing && !item.uploading && !item.uploaded) {
			menu.push({
				type: 'divider',
			}, {
				icon: 'ti ti-upload',
				text: i18n.ts.upload,
				action: () => {
					uploadOne(item);
				},
			}, {
				icon: 'ti ti-x',
				text: i18n.ts.remove,
				danger: true,
				action: () => {
					removeItem(item);
				},
			});
		} else if (item.uploading) {
			menu.push({
				type: 'divider',
			}, {
				icon: 'ti ti-cloud-pause',
				text: i18n.ts.abort,
				danger: true,
				action: () => {
					if (item.abort != null) {
						item.abort();
					}
				},
			});
		}

		return menu;
	}

	async function uploadOne(item: UploaderItem): Promise<void> {
		item.uploadFailed = false;
		item.uploading = true;

		const { filePromise, abort } = uploadFile(item.preprocessedFile ?? item.file, {
			name: item.uploadName ?? item.name,
			folderId: options.folderId,
			isSensitive: item.isSensitive ?? false,
			onProgress: (progress) => {
				if (item.progress == null) {
					item.progress = { max: progress.total, value: progress.loaded };
				} else {
					item.progress.value = progress.loaded;
					item.progress.max = progress.total;
				}
			},
		});

		item.abort = () => {
			item.abort = null;
			abort();
			item.uploading = false;
			item.uploadFailed = true;
		};

		await filePromise.then((file) => {
			item.uploaded = file;
			item.abort = null;
			events.emit('itemUploaded', { item });
		}).catch(err => {
			item.uploadFailed = true;
			item.progress = null;
			if (!(err instanceof UploadAbortedError)) {
				throw err;
			}
		}).finally(() => {
			item.uploading = false;
		});
	}

	async function upload() { // エラーハンドリングなどを考慮してシーケンシャルにやる
		items.value = items.value.map(item => ({
			...item,
			aborted: false,
			uploadFailed: false,
			uploading: false,
		}));

		for (const item of items.value.filter(item => item.uploaded == null)) {
			// アップロード処理途中で値が変わる場合（途中で全キャンセルされたりなど）もあるので、Array filterではなくここでチェック
			if (item.aborted) {
				continue;
			}

			await uploadOne(item);
		}
	}

	function abortAll() {
		for (const item of items.value) {
			if (item.uploaded != null) {
				continue;
			}

			if (item.abort != null) {
				item.abort();
			}
			item.aborted = true;
			item.uploadFailed = true;
		}
	}

	async function preprocess(item: UploaderItem): Promise<void> {
		item.preprocessing = true;

		try {
			if (IMAGE_PREPROCESS_NEEDED_TYPES.includes(item.file.type)) {
				await preprocessForImage(item);
			}
		} catch (err) {
			console.error('Failed to preprocess image', err);

			// nop
		}

		item.preprocessing = false;
	}

	async function preprocessForImage(item: UploaderItem): Promise<void> {
		const imageBitmap = await window.createImageBitmap(item.file);

		let preprocessedFile: Blob | File = item.file;

		const needsWatermark = item.watermarkPresetId != null && WATERMARK_SUPPORTED_TYPES.includes(preprocessedFile.type);
		const preset = prefer.s.watermarkPresets.find(p => p.id === item.watermarkPresetId);
		if (needsWatermark && preset != null) {
			const canvas = window.document.createElement('canvas');
			const renderer = new WatermarkRenderer({
				canvas: canvas,
				renderWidth: imageBitmap.width,
				renderHeight: imageBitmap.height,
				image: imageBitmap,
			});

			await renderer.setLayers(preset.layers);

			renderer.render();

			preprocessedFile = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					if (blob == null) {
						throw new Error('Failed to convert canvas to blob');
					}
					resolve(blob);
					renderer.destroy();
				}, 'image/png');
			});
		}

		const compressionSettings = getCompressionSettings(item.compressionLevel);
		const needsCompress = item.compressionLevel !== 0 && compressionSettings && IMAGE_COMPRESSION_SUPPORTED_TYPES.includes(preprocessedFile.type) && !(await isAnimated(preprocessedFile));

		if (needsCompress) {
			const config = {
				mimeType: isWebpSupported() ? 'image/webp' : 'image/jpeg',
				maxWidth: compressionSettings.maxWidth,
				maxHeight: compressionSettings.maxHeight,
				quality: isWebpSupported() ? 0.85 : 0.8,
			};

			try {
				const result = await readAndCompressImage(preprocessedFile, config);
				if (result.size < preprocessedFile.size || preprocessedFile.type === 'image/webp') {
					// The compression may not always reduce the file size
					// (and WebP is not browser safe yet)
					preprocessedFile = result;
					item.compressedSize = result.size;
					item.uploadName = preprocessedFile.type !== config.mimeType ? `${item.name}.${mimeTypeMap[config.mimeType]}` : item.name;
				}
			} catch (err) {
				console.error('Failed to resize image', err);
			}
		} else {
			item.compressedSize = null;
			item.uploadName = item.name;
		}

		imageBitmap.close();

		if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
		item.thumbnail = THUMBNAIL_SUPPORTED_TYPES.includes(preprocessedFile.type) ? window.URL.createObjectURL(preprocessedFile) : null;
		item.preprocessedFile = markRaw(preprocessedFile);
	}

	onUnmounted(() => {
		for (const item of items.value) {
			if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
		}
	});

	return {
		items,
		addFiles,
		removeItem,
		abortAll,
		upload,
		getMenu,
		uploading: computed(() => items.value.some(item => item.uploading)),
		readyForUpload: computed(() => items.value.length > 0 && items.value.some(item => item.uploaded == null) && !items.value.some(item => item.uploading || item.preprocessing)),
		allItemsUploaded: computed(() => items.value.every(item => item.uploaded != null)),
		events,
	};
}

