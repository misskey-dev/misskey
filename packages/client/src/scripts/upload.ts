import { reactive, ref } from 'vue';
import { defaultStore } from '@/store';
import { readAndCompressImage } from 'browser-image-resizer';
import { apiUrl } from '@/config';
import * as Misskey from 'misskey-js';
import { $i } from '@/account';

type Uploading = {
	id: string;
	name: string;
	progressMax: number | undefined;
	progressValue: number | undefined;
	img: string;
};
export const uploads = ref<Uploading[]>([]);

const compressTypeMap = {
	'image/jpeg': { quality: 0.85, mimeType: 'image/webp'},
	'image/webp': { quality: 0.85, mimeType: 'image/webp'},
	'image/png': { quality: 1, mimeType: 'image/webp'},
	'image/svg+xml': { quality: 1, mimeType: 'image/webp'},
} as const;

const mimeTypeMap = {
	'image/webp': 'webp',
} as const;

export function uploadFile(file: File, folder?: any, name?: string, keepOriginal: boolean = defaultStore.state.keepOriginalUploading): Promise<Misskey.entities.DriveFile> {
	if (folder && typeof folder == 'object') folder = folder.id;

	return new Promise((resolve, reject) => {
		const id = Math.random().toString();

		const reader = new FileReader();
		reader.onload = async (e) => {
			const ctx = reactive<Uploading>({
				id: id,
				name: name || file.name || 'untitled',
				progressMax: undefined,
				progressValue: undefined,
				img: window.URL.createObjectURL(file)
			});

			uploads.value.push(ctx);

			let resizedImage: any;
			if (!keepOriginal && file.type in compressTypeMap) {
				const config = {
					maxWidth: 2048,
					maxHeight: 2048,
					autoRotate: true,
					debug: true,
					...compressTypeMap[file.type],
				};
				resizedImage = await readAndCompressImage(file, config);
				ctx.name = `${ctx.name}.${mimeTypeMap[compressTypeMap[file.type].mimeType]}`;
			}

			const data = new FormData();
			data.append('i', $i.token);
			data.append('force', 'true');
			data.append('file', resizedImage || file);
			data.append('name', ctx.name);
			if (folder) data.append('folderId', folder);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.onload = (ev) => {
				if (xhr.status !== 200 || ev.target == null || ev.target.response == null) {
					// TODO: 消すのではなくて再送できるようにしたい
					uploads.value = uploads.value.filter(x => x.id != id);

					alert({
						type: 'error',
						text: 'upload failed'
					});

					reject();
					return;
				}

				const driveFile = JSON.parse(ev.target.response);

				resolve(driveFile);

				uploads.value = uploads.value.filter(x => x.id != id);
			};

			xhr.upload.onprogress = e => {
				if (e.lengthComputable) {
					ctx.progressMax = e.total;
					ctx.progressValue = e.loaded;
				}
			};

			xhr.send(data);
		};
		reader.readAsArrayBuffer(file);
	});
}
