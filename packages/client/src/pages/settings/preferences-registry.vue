<template>
<div class="_formRoot">
	<div :class="$style.buttons">
		<MkButton inline class="primary" @click="saveNew">{{ ts._preferencesRegistry.saveNew }}</MkButton>
		<MkButton inline class="" @click="loadFile">{{ ts._preferencesRegistry.loadFile }}</MkButton>
	</div>

	<FormSection>
		<template #label>{{ ts._preferencesRegistry.list }}</template>
		<div
			v-if="registries && Object.keys(registries).length > 0"
			v-for="(registry, id) in registries"
			:key="id"
			class="_formBlock _panel"
			:class="$style.registry"
			@click="$event => menu($event, id)"
			@contextmenu.prevent.stop="$event => menu($event, id)"
		>
			<div :class="$style.registryName">{{ registry.name }}</div>
			<div :class="$style.registryTime">{{ t('_preferencesRegistry.createdAt', { date: (new Date(registry.createdAt)).toLocaleDateString(), time: (new Date(registry.createdAt)).toLocaleTimeString() }) }}</div>
			<div :class="$style.registryTime" v-if="registry.updatedAt">{{ t('_preferencesRegistry.updatedAt', { date: (new Date(registry.updatedAt)).toLocaleDateString(), time: (new Date(registry.updatedAt)).toLocaleTimeString() }) }}</div>
		</div>
		<div v-else-if="registries">
			<MkInfo>{{ ts._preferencesRegistry.noRegistries }}</MkInfo>
		</div>
		<MkLoading v-else />
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useCssModule } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import * as os from '@/os';
import { v4 as uuid } from 'uuid';
import { ColdDeviceStorage, defaultStore } from '@/store';
import * as symbols from '@/symbols';
import { unisonReload } from '@/scripts/unison-reload';
import { stream } from '@/stream';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { version } from '@/config';
const { t, ts } = i18n;

useCssModule();

const scope = ['clientPreferencesProfiles'];

const connection = $i && stream.useChannel('main');

const registryProps = ['name', 'createdAt', 'updatedAt', 'version', 'defaultStore', 'coldDeviceStorage', 'fontSize', 'useSystemFont', 'wallpaper'];
type Registry = {
	name: string;
	createdAt: string;
	updatedAt: string | null;
	version: string;
	defaultStore: Partial<typeof defaultStore.state>;
	coldDeviceStorage: Partial<typeof ColdDeviceStorage.default>;
	fontSize: string | null;
	useSystemFont: 't' | null;
	wallpaper: string | null;
};

type Registries = {
	[key: string]: Registry;
};

let registries = $ref<Registries | null>(null);

os.api('i/registry/get-all', { scope })
	.then(res => {
		registries = res || {};
	});

function getDefaultStoreValues() {
	return (Object.keys(defaultStore.state) as (keyof typeof defaultStore.state)[]).reduce((acc, key) => {
		if (defaultStore.def[key].where !== 'account') acc[key] = defaultStore.state[key];
		return acc;
	}, {} as any);
}

function isObject(value: any) {
	return value && typeof value === 'object' && !Array.isArray(value);
}

function validate(registry: any): void {
	if (!registries) return;

	// Check if unnecessary properties exist
	if (Object.keys(registry).some(key => !registryProps.includes(key))) throw Error('Unnecessary properties exist');

	if (!registry.name) throw Error('Name is falsy');
	if (!registry.version) throw Error('Version is falsy');
	
	// Check if createdAt and updatedAt is Date
	// https://zenn.dev/lollipop_onl/articles/eoz-judge-js-invalid-date
	if (!registry.createdAt || Number.isNaN(new Date(registry.createdAt).getTime())) throw Error('createdAt is falsy or not Date');
	if (registry.updatedAt) {
		if (Number.isNaN(new Date(registry.updatedAt).getTime())) {
			throw Error('updatedAt is not Date');
		}
	} else if (registry.updatedAt !== null) {
		throw Error('updatedAt is not null');
	}

	if (!registry.defaultStore || !isObject(registry.defaultStore)) throw Error('defaultStore is falsy or not an object');
	if (!registry.coldDeviceStorage || !isObject(registry.coldDeviceStorage)) throw Error('coldDeviceStorage is falsy or not an object');
}

async function saveNew() {
	if (!registries) return;

	const { canceled, result: name } = await os.inputText({
		title: ts._preferencesRegistry.inputName,
		text: ts._preferencesRegistry.saveNewDescription,
	});

	if (canceled) return;
	if (Object.entries(registries).some(registry => registry[1].name === name)) {
		return os.alert({
			title: ts._preferencesRegistry.cannotSave,
			text: t('_preferencesRegistry.nameAlreadyExists', { name }),
		});
	}

	const id = uuid();
	const registry: Registry = {
		name,
		createdAt: (new Date()).toISOString(),
		updatedAt: null,
		version,
		defaultStore: getDefaultStoreValues(),
		coldDeviceStorage: ColdDeviceStorage.getAll(),
		fontSize: localStorage.getItem('fontSize'),
		useSystemFont: localStorage.getItem('useSystemFont') as 't' | null,
		wallpaper: localStorage.getItem('wallpaper'),
	};
	await os.apiWithDialog('i/registry/set', { scope, key: id, value: registry });
}

function loadFile() {
	const input = document.createElement('input');
	input.type = 'file';
	input.multiple = false;
	input.onchange = async () => {
		if (!registries) return;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];

		if (file.type !== 'application/json') {
			return os.alert({
				type: 'error',
				title: ts._preferencesRegistry.cannotLoad,
				text: ts._preferencesRegistry.invalidFile,
			});
		}

		let registry: Registry;
		try {
			registry = JSON.parse(await file.text()) as unknown as Registry;
			validate(registry);
		} catch (err) {
			return os.alert({
				type: 'error',
				title: ts._preferencesRegistry.cannotLoad,
				text: err?.message,
			});
		}

		const id = uuid();
		await os.apiWithDialog('i/registry/set', { scope, key: id, value: registry });

		// 一応廃棄
		(window as any).__misskey_input_ref__ = null;
	};

	// https://qiita.com/fukasawah/items/b9dc732d95d99551013d
	// iOS Safari で正常に動かす為のおまじない
	(window as any).__misskey_input_ref__ = input;

	input.click();
}

async function applyRegistry(id: string) {
	if (!registries) return;

	const registry = registries[id];

	const { canceled: cancel1 } = await os.confirm({
		type: 'warning',
		title: ts._preferencesRegistry.apply,
		text: t('_preferencesRegistry.applyConfirm', { name: registry.name }),
	});
	if (cancel1) return;

	// defaultStore
	for (const [key, value] of Object.entries(registry.defaultStore)) {
		if (key in defaultStore.def && defaultStore.def[key].where !== 'account') {
			defaultStore.set(key as keyof Registry['defaultStore'], value);
		}
	}

	// coldDeviceStorage
	for (const [key, value] of Object.entries(registry.coldDeviceStorage)) {
		ColdDeviceStorage.set(key as keyof Registry['coldDeviceStorage'], value);
	}

	// fontSize
	if (registry.fontSize) {
		localStorage.setItem('fontSize', registry.fontSize);
	} else {
		localStorage.removeItem('fontSize');
	}

	// useSystemFont
	if (registry.useSystemFont) {
		localStorage.setItem('useSystemFont', registry.useSystemFont);
	} else {
		localStorage.removeItem('useSystemFont');
	}

	// wallpaper
	if (registry.wallpaper != null) {
		localStorage.setItem('wallpaper', registry.wallpaper);
	} else {
		localStorage.removeItem('wallpaper');
	}

	const { canceled: cancel2 } = await os.confirm({
		type: 'info',
		text: ts.reloadToApplySetting,
	});
	if (cancel2) return;

	unisonReload();
}

async function deleteRegistry(id: string) {
	if (!registries) return;

	const { canceled } = await os.confirm({
		type: 'info',
		title: ts._preferencesRegistry.delete,
		text: t('_preferencesRegistry.deleteConfirm', { name: registries[id].name }),
	});
	if (canceled) return;

	await os.apiWithDialog('i/registry/remove', { scope, key: id });
	delete registries[id];
}

async function save(id: string) {
	if (!registries) return;

	const { name, createdAt } = registries[id];

	const { canceled } = await os.confirm({
		type: 'info',
		title: ts._preferencesRegistry.save,
		text: t('_preferencesRegistry.saveConfirm', { name }),
	});
	if (canceled) return;

	const registry: Registry = {
		name,
		createdAt,
		updatedAt: (new Date()).toISOString(),
		version,
		defaultStore: getDefaultStoreValues(),
		coldDeviceStorage: ColdDeviceStorage.getAll(),
		fontSize: localStorage.getItem('fontSize'),
		useSystemFont: localStorage.getItem('useSystemFont') as 't' | null,
		wallpaper: localStorage.getItem('wallpaper'),
	};
	await os.apiWithDialog('i/registry/set', { scope, key: id, value: registry });
}

async function rename(id: string) {
	if (!registries) return;

	const { canceled: cancel1, result: name } = await os.inputText({
		title: ts._preferencesRegistry.inputName,
	});
	if (cancel1 || registries[id].name === name) return;

	if (Object.entries(registries).some(e => e[1].name === name)) {
		return os.alert({
			title: ts._preferencesRegistry.cannotSave,
			text: t('_preferencesRegistry.nameAlreadyExists', { name }),
		});
	}

	const registry = Object.assign({}, { ...registries[id] });

	const { canceled: cancel2 } = await os.confirm({
		type: 'info',
		title: ts._preferencesRegistry.rename,
		text: t('_preferencesRegistry.renameConfirm', { old: registry.name, new: name }),
	});
	if (cancel2) return;

	registry.name = name;
	await os.apiWithDialog('i/registry/set', { scope, key: id, value: registry });
}

function menu(ev: MouseEvent, registryId: string) {
	if (!registries) return;

	return os.popupMenu([{
		text: ts._preferencesRegistry.apply,
		icon: 'fas fa-circle-down',
		action: () => applyRegistry(registryId),
	}, {
		type: 'a',
		text: ts._preferencesRegistry.download,
		icon: 'fas fa-download',
		href: URL.createObjectURL(new Blob([JSON.stringify(registries[registryId], null, 2)], { type: 'application/json' })),
		download: `${registries[registryId].name}.json`,
	}, {
		text: ts._preferencesRegistry.rename,
		icon: 'fas fa-i-cursor',
		action: () => rename(registryId),
	}, {
		text: ts._preferencesRegistry.save,
		icon: 'fas fa-floppy-disk',
		action: () => save(registryId),
	}, {
		text: ts._preferencesRegistry.delete,
		icon: 'fas fa-trash-can',
		action: () => deleteRegistry(registryId),
	}], ev.currentTarget ?? ev.target)
}

onMounted(() => {
	// streamingのuser storage updateイベントを監視して更新
	connection?.on('registryUpdated', ({ scope: recievedScope, key, value }) => {
		if (!recievedScope || recievedScope.length !== scope.length || recievedScope[0] !== scope[0]) return;
		if (!registries) return;

		registries[key] = value;
	});
});

onUnmounted(() => {
	connection?.off('registryUpdated');
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: ts.preferencesRegistry,
		icon: 'fas fa-floppy-disk',
		bg: 'var(--bg)',
	}
})
</script>

<style lang="scss" module>
.buttons {
	display: flex;
	gap: var(--margin);
	flex-wrap: wrap;
}

.registry {
	padding: 20px;
	cursor: pointer;

	&Name {
		font-weight: 700;
	}

	&Time {
		font-size: .85em;
		opacity: .7;
	}
}
</style>
