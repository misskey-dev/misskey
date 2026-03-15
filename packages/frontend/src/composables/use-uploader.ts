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
import type { WatermarkLayers, WatermarkPreset } from '@/utility/watermark/WatermarkRenderer.js';
import type { ImageFrameParams, ImageFramePreset } from '@/utility/image-frame-renderer/ImageFrameRenderer.js';
import { genId } from '@/utility/id.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { isWebpSupported } from '@/utility/isWebpSupported.js';
import { uploadFile, UploadAbortedError } from '@/utility/drive.js';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';

export type UploaderFeatures = {
	imageEditing?: boolean;
	watermark?: boolean;
};

const THUMBNAIL_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/svg+xml',
	'image/gif',
];

const IMAGE_EDITING_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];

const VIDEO_COMPRESSION_SUPPORTED_TYPES = [ // TODO
	'video/mp4',
	'video/quicktime',
	'video/x-matroska',
];

const IMAGE_PREPROCESS_NEEDED_TYPES = [
	...IMAGE_EDITING_SUPPORTED_TYPES,
];

const VIDEO_PREPROCESS_NEEDED_TYPES = [
	...VIDEO_COMPRESSION_SUPPORTED_TYPES,
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
	preprocessProgress: number | null;
	uploading: boolean;
	uploaded: Misskey.entities.DriveFile | null;
	uploadFailed: boolean;
	aborted: boolean;
	compressionLevel: 0 | 1 | 2 | 3;
	compressedSize?: number | null;
	preprocessedFile?: Blob | null;
	file: File;
	watermarkPreset: WatermarkPreset | null;
	watermarkLayers: WatermarkLayers | null;
	imageFrameParams: ImageFrameParams | null;
	isSensitive?: boolean;
	caption?: string | null;
	abort?: (() => void) | null;
	abortPreprocess?: (() => void) | null;
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
			imageEditing: options.features?.imageEditing ?? true,
			watermark: options.features?.watermark ?? true,
		};
	});

	const items = ref<UploaderItem[]>([]);

	function initializeFile(file: File) {
		const id = genId();
		const filename = file.name ?? 'untitled';
		const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';
		const watermarkPreset = uploaderFeatures.value.watermark && $i.policies.watermarkAvailable ? (prefer.s.watermarkPresets.find(p => p.id === prefer.s.defaultWatermarkPresetId) ?? null) : null;
		items.value.push({
			id,
			name: prefer.s.keepOriginalFilename ? filename : id + extension,
			progress: null,
			thumbnail: THUMBNAIL_SUPPORTED_TYPES.includes(file.type) ? window.URL.createObjectURL(file) : null,
			preprocessing: false,
			preprocessProgress: null,
			uploading: false,
			aborted: false,
			uploaded: null,
			uploadFailed: false,
			compressionLevel: IMAGE_EDITING_SUPPORTED_TYPES.includes(file.type) ? prefer.s.defaultImageCompressionLevel : VIDEO_COMPRESSION_SUPPORTED_TYPES.includes(file.type) ? prefer.s.defaultVideoCompressionLevel : 0,
			watermarkPreset,
			watermarkLayers: watermarkPreset?.layers ?? null,
			imageFrameParams: null,
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
				text: i18n.ts.describeFile,
				icon: 'ti ti-text-caption',
				action: async () => {
					const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkFileCaptionEditWindow.vue').then(x => x.default), {
						default: item.caption ?? null,
					}, {
						done: caption => {
							if (caption != null) {
								item.caption = caption.trim().length === 0 ? null : caption;
							}
						},
						closed: () => dispose(),
					});
				},
			}, {
				type: 'divider',
			});
		}

		if (
			uploaderFeatures.value.imageEditing &&
			IMAGE_EDITING_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			menu.push({
				type: 'parent',
				icon: 'ti ti-photo-edit',
				text: i18n.ts._uploader.editImage,
				children: [{
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
				}, /*{
					icon: 'ti ti-resize',
					text: i18n.ts.resize,
					action: async () => {
						// TODO
					},
				},*/ {
					icon: 'ti ti-sparkles',
					text: i18n.ts._imageEffector.title,
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
				}],
			});
		}

		if (
			uploaderFeatures.value.watermark &&
			$i.policies.watermarkAvailable &&
			IMAGE_EDITING_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			function change(layers: WatermarkLayers | null, preset?: WatermarkPreset | null) {
				item.watermarkPreset = preset ?? null;
				item.watermarkLayers = layers;
				preprocess(item).then(() => {
					triggerRef(items);
				});
			}

			menu.push({
				icon: 'ti ti-copyright',
				text: i18n.ts.watermark,
				caption: computed(() => item.watermarkPreset != null ? item.watermarkPreset.name : item.watermarkLayers != null ? i18n.ts.custom : null),
				type: 'parent',
				children: [{
					type: 'button' as const,
					icon: 'ti ti-pencil',
					text: i18n.ts.edit,
					action: async () => {
						const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkWatermarkEditorDialog.vue').then(x => x.default), {
							layers: item.watermarkLayers,
							image: item.file,
						}, {
							ok: (layers) => {
								change(layers);
							},
							closed: () => dispose(),
						});
					},
				}, {
					type: 'button' as const,
					icon: 'ti ti-x',
					text: i18n.ts.remove,
					action: () => change(null),
				}, {
					type: 'divider',
				}, {
					type: 'label',
					text: i18n.ts.presets,
				}, ...prefer.s.watermarkPresets.map(preset => ({
					type: 'radioOption' as const,
					text: preset.name,
					active: computed(() => item.watermarkPreset?.id === preset.id),
					action: () => change(preset.layers, preset),
				}))],
			});
		}

		if (
			uploaderFeatures.value.imageEditing &&
			IMAGE_EDITING_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			function change(params: ImageFrameParams | null) {
				item.imageFrameParams = params;
				preprocess(item).then(() => {
					triggerRef(items);
				});
			}

			menu.push({
				icon: 'ti ti-device-ipad-horizontal',
				text: i18n.ts.frame,
				type: 'parent' as const,
				children: [{
					type: 'button' as const,
					icon: 'ti ti-pencil',
					text: i18n.ts.edit,
					action: async () => {
						const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImageFrameEditorDialog.vue').then(x => x.default), {
							params: item.imageFrameParams,
							image: item.file,
							imageCaption: item.caption ?? null,
							imageFilename: item.name,
						}, {
							ok: (params) => {
								change(params);
							},
							closed: () => dispose(),
						});
					},
				}, ...(item.imageFrameParams != null ? [{
					type: 'button' as const,
					icon: 'ti ti-x',
					text: i18n.ts.remove,
					action: () => change(null),
				}] : []), {
					type: 'divider' as const,
				}, {
					type: 'label' as const,
					text: i18n.ts.presets,
				}, ...prefer.s.imageFramePresets.map(preset => ({
					type: 'button' as const,
					text: preset.name,
					action: async () => {
						const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImageFrameEditorDialog.vue').then(x => x.default), {
							params: preset.params,
							image: item.file,
							imageCaption: item.caption ?? null,
							imageFilename: item.name,
						}, {
							ok: (params) => {
								change(params);
							},
							closed: () => dispose(),
						});
					},
				}))],
			});
		}

		if (
			(IMAGE_EDITING_SUPPORTED_TYPES.includes(item.file.type) || VIDEO_COMPRESSION_SUPPORTED_TYPES.includes(item.file.type)) &&
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
		} else if (item.preprocessing && item.abortPreprocess != null) {
			menu.push({
				type: 'divider',
			}, {
				icon: 'ti ti-player-stop',
				text: i18n.ts.abort,
				danger: true,
				action: () => {
					if (item.abortPreprocess != null) {
						item.abortPreprocess();
					}
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
			folderId: options.folderId === undefined ? prefer.s.uploadFolder : options.folderId,
			isSensitive: item.isSensitive ?? false,
			caption: item.caption ?? null,
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

			if (item.abortPreprocess != null) {
				item.abortPreprocess();
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
		item.preprocessProgress = null;

		if (IMAGE_PREPROCESS_NEEDED_TYPES.includes(item.file.type)) {
			try {
				await preprocessForImage(item);
			} catch (err) {
				console.error('Failed to preprocess image', err);

			// nop
			}
		}

		if (VIDEO_PREPROCESS_NEEDED_TYPES.includes(item.file.type)) {
			try {
				await preprocessForVideo(item);
			} catch (err) {
				console.error('Failed to preprocess video', err);

				// nop
			}
		}

		item.preprocessing = false;
		item.preprocessProgress = null;
	}

	async function preprocessForImage(item: UploaderItem): Promise<void> {
		const imageBitmap = await window.createImageBitmap(item.file);

		let preprocessedFile: Blob | File = item.file;

		const needsWatermark = item.watermarkLayers != null && IMAGE_EDITING_SUPPORTED_TYPES.includes(preprocessedFile.type) && $i.policies.watermarkAvailable;
		if (needsWatermark && item.watermarkLayers != null) {
			const canvas = window.document.createElement('canvas');
			const WatermarkRenderer = await import('@/utility/watermark/WatermarkRenderer.js').then(x => x.WatermarkRenderer);
			const renderer = new WatermarkRenderer({
				canvas: canvas,
				renderWidth: imageBitmap.width,
				renderHeight: imageBitmap.height,
				image: imageBitmap,
			});

			await renderer.render(item.watermarkLayers);

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

		const needsImageFrame = item.imageFrameParams != null && IMAGE_EDITING_SUPPORTED_TYPES.includes(preprocessedFile.type);
		if (needsImageFrame && item.imageFrameParams != null) {
			const canvas = window.document.createElement('canvas');
			const ExifReader = await import('exifreader');
			const exif = await ExifReader.load(await item.file.arrayBuffer());
			const ImageFrameRenderer = await import('@/utility/image-frame-renderer/ImageFrameRenderer.js').then(x => x.ImageFrameRenderer);
			const frameRenderer = new ImageFrameRenderer({
				canvas: canvas,
				image: await window.createImageBitmap(preprocessedFile),
				exif,
				caption: item.caption ?? null,
				filename: item.name,
			});

			await frameRenderer.render(item.imageFrameParams);

			preprocessedFile = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					if (blob == null) {
						throw new Error('Failed to convert canvas to blob');
					}
					resolve(blob);
					frameRenderer.destroy();
				}, 'image/png');
			});
		}

		const compressionSettings = getCompressionSettings(item.compressionLevel);
		const needsCompress = item.compressionLevel !== 0 && compressionSettings && IMAGE_EDITING_SUPPORTED_TYPES.includes(preprocessedFile.type) && !(await isAnimated(preprocessedFile));

		if (needsCompress) {
			const config = {
				mimeType: (isWebpSupported() ? 'image/webp' : 'image/jpeg') as 'image/webp' | 'image/jpeg',
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

	async function preprocessForVideo(item: UploaderItem): Promise<void> {
		let preprocessedFile: Blob | File = item.file;

		const needsCompress = item.compressionLevel !== 0 && VIDEO_COMPRESSION_SUPPORTED_TYPES.includes(preprocessedFile.type);

		if (needsCompress) {
			const mediabunny = await import('mediabunny');

			const source = new mediabunny.BlobSource(preprocessedFile);

			const input = new mediabunny.Input({
				source,
				formats: mediabunny.ALL_FORMATS,
			});

			const output = new mediabunny.Output({
				target: new mediabunny.BufferTarget(),
				format: new mediabunny.Mp4OutputFormat(),
			});

			const currentConversion = await mediabunny.Conversion.init({
				input,
				output,
				video: {
					//width: 320, // Height will be deduced automatically to retain aspect ratio
					bitrate: item.compressionLevel === 1 ? mediabunny.QUALITY_VERY_HIGH : item.compressionLevel === 2 ? mediabunny.QUALITY_MEDIUM : mediabunny.QUALITY_VERY_LOW,
				},
				audio: {
					// Explicitly keep audio (don't discard) and copy it if possible
					// without re-encoding to avoid WebCodecs limitations on iOS Safari
					discard: false,
				},
			});

			currentConversion.onProgress = newProgress => item.preprocessProgress = newProgress;

			item.abortPreprocess = () => {
				item.abortPreprocess = null;
				currentConversion.cancel();
				item.preprocessing = false;
				item.preprocessProgress = null;
			};

			await currentConversion.execute();

			item.abortPreprocess = null;

			preprocessedFile = new Blob([output.target.buffer!], { type: output.format.mimeType });
			item.compressedSize = output.target.buffer!.byteLength;
			item.uploadName = `${item.name}.mp4`;
		} else {
			item.compressedSize = null;
			item.uploadName = item.name;
		}

		if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
		item.thumbnail = THUMBNAIL_SUPPORTED_TYPES.includes(preprocessedFile.type) ? window.URL.createObjectURL(preprocessedFile) : null;
		item.preprocessedFile = markRaw(preprocessedFile);
	}

	function dispose() {
		for (const item of items.value) {
			if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
		}

		abortAll();
	}

	onUnmounted(() => {
		dispose();
	});

	return {
		items,
		addFiles,
		removeItem,
		abortAll,
		dispose,
		upload,
		getMenu,
		uploading: computed(() => items.value.some(item => item.uploading)),
		readyForUpload: computed(() => items.value.length > 0 && items.value.some(item => item.uploaded == null) && !items.value.some(item => item.uploading || item.preprocessing)),
		allItemsUploaded: computed(() => items.value.every(item => item.uploaded != null)),
		events,
	};
}

