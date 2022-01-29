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

const compressTypeMap = new Map([
	// [圧縮前の形式, 圧縮後の形式],
	['image/jpeg', 'image/jpeg'],
	['image/webp', 'image/jpeg'],
	['image/png', 'image/png'],
	['image/svg', 'image/png'],
]);

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

			let resizedImage: any;
			if (!keepOriginal && compressTypeMap.has(file.type)) {
				const config = {
					quality: 0.85,
					maxWidth: 2048,
					maxHeight: 2048,
					autoRotate: true,
					mimeType: compressTypeMap.get(file.type),
					debug: true,
				};
				resizedImage = await readAndCompressImage(file, config);
			}

			uploads.value.push(ctx);

			const data = new FormData();
			data.append('i', $i.token);
			data.append('force', 'true');
			data.append('file', resizedImage || file);

			if (folder) data.append('folderId', folder);
			if (name) data.append('name', name);

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
				console.log(driveFile)
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
