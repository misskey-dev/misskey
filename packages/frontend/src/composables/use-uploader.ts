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
	imageEditing?: boolean;
	watermark?: boolean;
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

const IMAGE_EDITING_SUPPORTED_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];

const WATERMARK_SUPPORTED_TYPES = IMAGE_EDITING_SUPPORTED_TYPES;

const IMAGE_PREPROCESS_NEEDED_TYPES = [
	...WATERMARK_SUPPORTED_TYPES,
	...IMAGE_COMPRESSION_SUPPORTED_TYPES,
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
	caption?: string | null;
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

export class FileUploader {
	private $i: Misskey.entities.MeDetailed;
	public events = new EventEmitter<{
		'itemUploaded': (ctx: { item: UploaderItem; }) => void;
	}>();
	private uploaderFeatures = computed<Required<UploaderFeatures>>(() => {
		return {
			imageEditing: this.options.features?.imageEditing ?? true,
			watermark: this.options.features?.watermark ?? true,
		};
	});
	public items = ref<UploaderItem[]>([]);
	public uploading = computed(() => this.items.value.some(item => item.uploading));
	public readyForUpload = computed(() => this.items.value.length > 0 && this.items.value.some(item => item.uploaded == null) && !this.items.value.some(item => item.uploading || item.preprocessing));
	public allItemsUploaded = computed(() => this.items.value.every(item => item.uploaded != null));

	constructor(
		public options: {
			folderId?: string | null;
			multiple?: boolean;
			features?: UploaderFeatures;
		} = {}
	) {
		this.$i = ensureSignin();

		onUnmounted(() => {
			for (const item of this.items.value) {
				if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
			}
		});
	}

	private initializeFile(file: File) {
		const id = genId();
		const filename = file.name ?? 'untitled';
		const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';
		this.items.value.push({
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
			watermarkPresetId: this.uploaderFeatures.value.watermark && this.$i.policies.watermarkAvailable ? prefer.s.defaultWatermarkPresetId : null,
			file: markRaw(file),
		});
		const reactiveItem = this.items.value.at(-1)!;
		this.preprocess(reactiveItem).then(() => {
			triggerRef(this.items);
		});
	}

	public addFiles(newFiles: File[]) {
		for (const file of newFiles) {
			this.initializeFile(file);
		}
	}

	public removeItem(item: UploaderItem) {
		if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
		this.items.value.splice(this.items.value.indexOf(item), 1);
	}

	public getMenu(item: UploaderItem): MenuItem[] {
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
			this.uploaderFeatures.value.imageEditing &&
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
						this.items.value.splice(this.items.value.indexOf(item), 1, {
							...item,
							file: markRaw(cropped),
							thumbnail: window.URL.createObjectURL(cropped),
						});
						const reactiveItem = this.items.value.find(x => x.id === item.id)!;
						this.preprocess(reactiveItem).then(() => {
							triggerRef(this.items);
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
					text: i18n.ts._imageEffector.title + ' (BETA)',
					action: async () => {
						const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImageEffectorDialog.vue').then(x => x.default), {
							image: item.file,
						}, {
							ok: (file) => {
								if (item.thumbnail != null) URL.revokeObjectURL(item.thumbnail);
								this.items.value.splice(this.items.value.indexOf(item), 1, {
									...item,
									file: markRaw(file),
									thumbnail: window.URL.createObjectURL(file),
								});
								const reactiveItem = this.items.value.find(x => x.id === item.id)!;
								this.preprocess(reactiveItem).then(() => {
									triggerRef(this.items);
								});
							},
							closed: () => dispose(),
						});
					},
				}],
			});
		}

		if (
			this.uploaderFeatures.value.watermark &&
			this.$i.policies.watermarkAvailable &&
			WATERMARK_SUPPORTED_TYPES.includes(item.file.type) &&
			!item.preprocessing &&
			!item.uploading &&
			!item.uploaded
		) {
			const changeWatermarkPreset = (presetId: string | null) => {
				item.watermarkPresetId = presetId;
				this.preprocess(item).then(() => {
					triggerRef(this.items);
				});
			};

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
			const changeCompressionLevel = (level: 0 | 1 | 2 | 3) => {
				item.compressionLevel = level;
				this.preprocess(item).then(() => {
					triggerRef(this.items);
				});
			};

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
					this.uploadOne(item);
				},
			}, {
				icon: 'ti ti-x',
				text: i18n.ts.remove,
				danger: true,
				action: () => {
					this.removeItem(item);
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

	private async uploadOne(item: UploaderItem): Promise<void> {
		item.uploadFailed = false;
		item.uploading = true;

		const { filePromise, abort } = uploadFile(item.preprocessedFile ?? item.file, {
			name: item.uploadName ?? item.name,
			folderId: this.options.folderId === undefined ? prefer.s.uploadFolder : this.options.folderId,
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
			this.events.emit('itemUploaded', { item });
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

	public async upload() { // エラーハンドリングなどを考慮してシーケンシャルにやる
		this.items.value = this.items.value.map(item => ({
			...item,
			aborted: false,
			uploadFailed: false,
			uploading: false,
		}));

		for (const item of this.items.value.filter(item => item.uploaded == null)) {
			// アップロード処理途中で値が変わる場合（途中で全キャンセルされたりなど）もあるので、Array filterではなくここでチェック
			if (item.aborted) {
				continue;
			}

			await this.uploadOne(item);
		}
	}

	public abortAll() {
		for (const item of this.items.value) {
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

	private async preprocess(item: UploaderItem): Promise<void> {
		item.preprocessing = true;

		try {
			if (IMAGE_PREPROCESS_NEEDED_TYPES.includes(item.file.type)) {
				await this.preprocessForImage(item);
			}
		} catch (err) {
			console.error('Failed to preprocess image', err);

			// nop
		}

		item.preprocessing = false;
	}

	private async preprocessForImage(item: UploaderItem): Promise<void> {
		const imageBitmap = await window.createImageBitmap(item.file);

		let preprocessedFile: Blob | File = item.file;

		const needsWatermark = item.watermarkPresetId != null && WATERMARK_SUPPORTED_TYPES.includes(preprocessedFile.type) && this.$i.policies.watermarkAvailable;
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
}
