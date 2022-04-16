<template>
<div class="_formRoot">
	<MkButton class="primary" @click="saveNew">{{ ts._preferencesRegistry.saveNew }}</MkButton>

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
			<div :class="$style.registryTime" v-if="registry.updatedAt">{{ t('_preferencesRegistry.updatedAt', { date: (new Date(registry.createdAt)).toLocaleDateString(), time: (new Date(registry.createdAt)).toLocaleTimeString() }) }}</div>
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
const { t, ts } = i18n;

useCssModule();

const scope = ['clientPreferencesProfiles'];

const connection = $i && stream.useChannel('main');

type Registry = {
	name: string;
	createdAt: string;
	updatedAt: string | null;
	defaultStore: Partial<typeof defaultStore.state>;
	coldDeviceStorage: Partial<typeof ColdDeviceStorage.default>;
	fontSize: string | null;
	useSystemFont: 't' | null;
};

type Registries = {
	[key: string]: Registry;
};

let registries = $ref<Registries | null>(null);

os.api('i/registry/get-all', { scope })
	.then(res => {
		registries = res || {};
		console.log(registries);
	});

function getDefaultStoreValues() {
	return (Object.keys(defaultStore.state) as (keyof typeof defaultStore.state)[]).reduce((acc, key) => {
		if (defaultStore.def[key].where !== 'account') acc[key] = defaultStore.state[key];
		return acc;
	}, {} as any);
}

async function saveNew() {
	if (!registries) return;

	const { canceled, result: name } = await os.inputText({
		title: ts._preferencesRegistry.inputName,
		text: ts._preferencesRegistry.saveNewDescription,
	});

	if (canceled) return;
	if (Object.entries(registries).some(e => e[1].name === name)) {
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
		defaultStore: getDefaultStoreValues(),
		coldDeviceStorage: ColdDeviceStorage.getAll(),
		fontSize: localStorage.getItem('fontSize'),
		useSystemFont: localStorage.getItem('useSystemFont') as 't' | null,
	};
	await os.api('i/registry/set', { scope, key: id, value: registry });
	registries[id] = registry;
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
			console.log(key);
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

	await os.api('i/registry/remove', { scope, key: id });
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
		defaultStore: getDefaultStoreValues(),
		coldDeviceStorage: ColdDeviceStorage.getAll(),
	};
	await os.api('i/registry/set', { scope, key: id, value: registry });
	registries[id] = registry;
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
	await os.api('i/registry/set', { scope, key: id, value: registry });
}

function menu(ev: MouseEvent, registryId: string) {
	return os.popupMenu([{
		text: ts._preferencesRegistry.apply,
		icon: 'fas fa-circle-down',
		action: () => applyRegistry(registryId),
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
