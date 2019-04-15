import { apiUrl, locale } from '../../config';

export default (self: any, ab: 'avatar' | 'banner') => {
	const cropImage = file => new Promise(async (resolve, reject) => {
		const Crop = await import('../views/components/crop.vue').then(x => x.default);
		const w = self.$root.new(Crop, {
			image: file,
			title: locale['common'][ab]['crop-title'],
			aspectRatio: ab === 'avatar' ? 1 : 16 / 9
		});

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', self.$store.state.i.token);
			data.append('file', blob, file.name + '.cropped.png');

			self.$root.api('drive/folders/find', {
				name: locale['common'][ab]['name']
			}).then(folder => {
				if (folder.length === 0) {
					self.$root.api('drive/folders/create', {
						name: locale['common'][ab]['name']
					}).then(iconFolder => {
						resolve(upload(data, iconFolder));
					});
				} else {
					resolve(upload(data, folder[0]));
				}
			});
		});

		w.$once('skipped', () => {
			resolve(file);
		});

		w.$once('cancelled', reject);

		document.body.appendChild(w.$el);
	});

	const upload = (data, folder) => new Promise((resolve, reject) => {
		if (folder) data.append('folderId', folder.id);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', apiUrl + '/drive/files/create', true);
		xhr.onload = e => {
			const file = JSON.parse((e.target as any).response);
			resolve(file);
		};
		xhr.onerror = reject;

		xhr.send(data);
	});

	const setImage = file => {
		return self.$root.api('i/update', {
			[`${ab}Id`]: file.id
		}).then(i => {
			self.$store.commit('updateIKeyValue', { key: `${ab}Color`, value: i[`${ab}Color`] });
			self.$store.commit('updateIKeyValue', { key: `${ab}Id`, value: i[`${ab}Id`] });
			self.$store.commit('updateIKeyValue', { key: `${ab}Url`, value: i[`${ab}Url`] });

			self.$root.dialog({
				title: locale['common'][ab]['updated'],
				text: null
			});

			return i;
		});
	};

	return async (file = null) => {
		const selectedFile = file
			? file
			: await self.$root.$chooseDriveFile({
				multiple: false,
				title: locale['common'][ab]['choose']
			});

		if (!selectedFile.type.startsWith('image/')) {
			self.$root.dialog({
				type: 'error',
				title: locale['common']['invalid-filetype']
			});
			return;
		}

		return cropImage(selectedFile)
			.then(setImage)
			.catch(err => err && console.warn(err));
	};
};
