<template>
<div class="_formRoot">
	<div :class="$style.buttons">
		<MkButton inline primary @click="saveNew">{{ ts._preferencesBackups.saveNew }}</MkButton>
		<MkButton inline @click="loadFile">{{ ts._preferencesBackups.loadFile }}</MkButton>
	</div>

	<FormSection>
		<template #label>{{ ts._preferencesBackups.list }}</template>
		<template v-if="profiles && Object.keys(profiles).length > 0">
			<div
				v-for="(profile, id) in profiles"
				:key="id"
				class="_formBlock _panel"
				:class="$style.profile"
				@click="$event => menu($event, id)"
				@contextmenu.prevent.stop="$event => menu($event, id)"
			>
				<div :class="$style.profileName">{{ profile.name }}</div>
				<div :class="$style.profileTime">{{ t('_preferencesBackups.createdAt', { date: (new Date(profile.createdAt)).toLocaleDateString(), time: (new Date(profile.createdAt)).toLocaleTimeString() }) }}</div>
				<div v-if="profile.updatedAt" :class="$style.profileTime">{{ t('_preferencesBackups.updatedAt', { date: (new Date(profile.updatedAt)).toLocaleDateString(), time: (new Date(profile.updatedAt)).toLocaleTimeString() }) }}</div>
			</div>
		</template>
		<div v-else-if="profiles">
			<MkInfo>{{ ts._preferencesBackups.noBackups }}</MkInfo>
		</div>
		<MkLoading v-else/>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, useCssModule } from 'vue';
import { v4 as uuid } from 'uuid';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { ColdDeviceStorage, defaultStore } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { stream } from '@/stream';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { version, host } from '@/config';
import { definePageMetadata } from '@/scripts/page-metadata';
const { t, ts } = i18n;

useCssModule();

const defaultStoreSaveKeys: (keyof typeof defaultStore['state'])[] = [
	'menu',
	'visibility',
	'localOnly',
	'statusbars',
	'widgets',
	'tl',
	'overridedDeviceKind',
	'serverDisconnectedBehavior',
	'nsfw',
	'animation',
	'animatedMfm',
	'loadRawImages',
	'imageNewTab',
	'disableShowingAnimatedImages',
	'disablePagesScript',
	'useOsNativeEmojis',
	'disableDrawer',
	'useBlurEffectForModal',
	'useBlurEffect',
	'showFixedPostForm',
	'enableInfiniteScroll',
	'useReactionPickerForContextMenu',
	'showGapBetweenNotesInTimeline',
	'instanceTicker',
	'reactionPickerSize',
	'reactionPickerWidth',
	'reactionPickerHeight',
	'reactionPickerUseDrawerForMobile',
	'defaultSideView',
	'menuDisplay',
	'reportError',
	'squareAvatars',
	'numberOfPageCache',
	'aiChanMode',
];
const coldDeviceStorageSaveKeys: (keyof typeof ColdDeviceStorage.default)[] = [
	'lightTheme',
	'darkTheme',
	'syncDeviceDarkMode',
	'plugins',
	'mediaVolume',
	'sound_masterVolume',
	'sound_note',
	'sound_noteMy',
	'sound_notification',
	'sound_chat',
	'sound_chatBg',
	'sound_antenna',
	'sound_channel',
];

const scope = ['clientPreferencesProfiles'];

const profileProps = ['name', 'createdAt', 'updatedAt', 'misskeyVersion', 'settings'];

type Profile = {
	name: string;
	createdAt: string;
	updatedAt: string | null;
	misskeyVersion: string;
	host: string;
	settings: {
		hot: Record<keyof typeof defaultStoreSaveKeys, unknown>;
		cold: Record<keyof typeof coldDeviceStorageSaveKeys, unknown>;
		fontSize: string | null;
		useSystemFont: 't' | null;
		wallpaper: string | null;
	};
};

const connection = $i && stream.useChannel('main');

let profiles = $ref<Record<string, Profile> | null>(null);

os.api('i/registry/get-all', { scope })
	.then(res => {
		profiles = res || {};
	});

function isObject(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object' && !Array.isArray(value);
}

function validate(profile: unknown): void {
	if (!isObject(profile)) throw new Error('not an object');

	// Check if unnecessary properties exist
	if (Object.keys(profile).some(key => !profileProps.includes(key))) throw new Error('Unnecessary properties exist');

	if (!profile.name) throw new Error('Missing required prop: name');
	if (!profile.misskeyVersion) throw new Error('Missing required prop: misskeyVersion');
	
	// Check if createdAt and updatedAt is Date
	// https://zenn.dev/lollipop_onl/articles/eoz-judge-js-invalid-date
	if (!profile.createdAt || Number.isNaN(new Date(profile.createdAt).getTime())) throw new Error('createdAt is falsy or not Date');
	if (profile.updatedAt) {
		if (Number.isNaN(new Date(profile.updatedAt).getTime())) {
			throw new Error('updatedAt is not Date');
		}
	} else if (profile.updatedAt !== null) {
		throw new Error('updatedAt is not null');
	}

	if (!profile.settings) throw new Error('Missing required prop: settings');
	if (!isObject(profile.settings)) throw new Error('Invalid prop: settings');
}

function getSettings(): Profile['settings'] {
	const hot = {} as Record<keyof typeof defaultStoreSaveKeys, unknown>;
	for (const key of defaultStoreSaveKeys) {
		hot[key] = defaultStore.state[key];
	}

	const cold = {} as Record<keyof typeof coldDeviceStorageSaveKeys, unknown>;
	for (const key of coldDeviceStorageSaveKeys) {
		cold[key] = ColdDeviceStorage.get(key);
	}

	return {
		hot,
		cold,
		fontSize: localStorage.getItem('fontSize'),
		useSystemFont: localStorage.getItem('useSystemFont') as 't' | null,
		wallpaper: localStorage.getItem('wallpaper'),
	};
}

async function saveNew(): Promise<void> {
	if (!profiles) return;

	const { canceled, result: name } = await os.inputText({
		title: ts._preferencesBackups.inputName,
	});
	if (canceled) return;

	if (Object.values(profiles).some(x => x.name === name)) {
		return os.alert({
			title: ts._preferencesBackups.cannotSave,
			text: t('_preferencesBackups.nameAlreadyExists', { name }),
		});
	}

	const id = uuid();
	const profile: Profile = {
		name,
		createdAt: (new Date()).toISOString(),
		updatedAt: null,
		misskeyVersion: version,
		host,
		settings: getSettings(),
	};
	await os.apiWithDialog('i/registry/set', { scope, key: id, value: profile });
}

function loadFile(): void {
	const input = document.createElement('input');
	input.type = 'file';
	input.multiple = false;
	input.onchange = async () => {
		if (!profiles) return;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];

		if (file.type !== 'application/json') {
			return os.alert({
				type: 'error',
				title: ts._preferencesBackups.cannotLoad,
				text: ts._preferencesBackups.invalidFile,
			});
		}

		let profile: Profile;
		try {
			profile = JSON.parse(await file.text()) as unknown as Profile;
			validate(profile);
		} catch (err) {
			return os.alert({
				type: 'error',
				title: ts._preferencesBackups.cannotLoad,
				text: err?.message,
			});
		}

		const id = uuid();
		await os.apiWithDialog('i/registry/set', { scope, key: id, value: profile });

		// 一応廃棄
		(window as any).__misskey_input_ref__ = null;
	};

	// https://qiita.com/fukasawah/items/b9dc732d95d99551013d
	// iOS Safari で正常に動かす為のおまじない
	(window as any).__misskey_input_ref__ = input;

	input.click();
}

async function applyProfile(id: string): Promise<void> {
	if (!profiles) return;

	const profile = profiles[id];

	const { canceled: cancel1 } = await os.confirm({
		type: 'warning',
		title: ts._preferencesBackups.apply,
		text: t('_preferencesBackups.applyConfirm', { name: profile.name }),
	});
	if (cancel1) return;

	// TODO: バージョン or ホストが違ったらさらに警告を表示

	const settings = profile.settings;

	// defaultStore
	for (const key of defaultStoreSaveKeys) {
		if (settings.hot[key] !== undefined) {
			defaultStore.set(key, settings.hot[key]);
		}
	}
	
	// coldDeviceStorage
	for (const key of coldDeviceStorageSaveKeys) {
		if (settings.cold[key] !== undefined) {
			ColdDeviceStorage.set(key, settings.cold[key]);
		}
	}

	// fontSize
	if (settings.fontSize) {
		localStorage.setItem('fontSize', settings.fontSize);
	} else {
		localStorage.removeItem('fontSize');
	}

	// useSystemFont
	if (settings.useSystemFont) {
		localStorage.setItem('useSystemFont', settings.useSystemFont);
	} else {
		localStorage.removeItem('useSystemFont');
	}

	// wallpaper
	if (settings.wallpaper != null) {
		localStorage.setItem('wallpaper', settings.wallpaper);
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

async function deleteProfile(id: string): Promise<void> {
	if (!profiles) return;

	const { canceled } = await os.confirm({
		type: 'info',
		title: ts.delete,
		text: t('deleteAreYouSure', { x: profiles[id].name }),
	});
	if (canceled) return;

	await os.apiWithDialog('i/registry/remove', { scope, key: id });
	delete profiles[id];
}

async function save(id: string): Promise<void> {
	if (!profiles) return;

	const { name, createdAt } = profiles[id];

	const { canceled } = await os.confirm({
		type: 'info',
		title: ts._preferencesBackups.save,
		text: t('_preferencesBackups.saveConfirm', { name }),
	});
	if (canceled) return;

	const profile: Profile = {
		name,
		createdAt,
		updatedAt: (new Date()).toISOString(),
		misskeyVersion: version,
		host,
		settings: getSettings(),
	};
	await os.apiWithDialog('i/registry/set', { scope, key: id, value: profile });
}

async function rename(id: string): Promise<void> {
	if (!profiles) return;

	const { canceled: cancel1, result: name } = await os.inputText({
		title: ts._preferencesBackups.inputName,
	});
	if (cancel1 || profiles[id].name === name) return;

	if (Object.values(profiles).some(x => x.name === name)) {
		return os.alert({
			title: ts._preferencesBackups.cannotSave,
			text: t('_preferencesBackups.nameAlreadyExists', { name }),
		});
	}

	const registry = Object.assign({}, { ...profiles[id] });

	const { canceled: cancel2 } = await os.confirm({
		type: 'info',
		title: ts._preferencesBackups.rename,
		text: t('_preferencesBackups.renameConfirm', { old: registry.name, new: name }),
	});
	if (cancel2) return;

	registry.name = name;
	await os.apiWithDialog('i/registry/set', { scope, key: id, value: registry });
}

function menu(ev: MouseEvent, profileId: string) {
	if (!profiles) return;

	return os.popupMenu([{
		text: ts._preferencesBackups.apply,
		icon: 'fas fa-circle-down',
		action: () => applyProfile(profileId),
	}, {
		type: 'a',
		text: ts.download,
		icon: 'fas fa-download',
		href: URL.createObjectURL(new Blob([JSON.stringify(profiles[profileId], null, 2)], { type: 'application/json' })),
		download: `${profiles[profileId].name}.json`,
	}, null, {
		text: ts.rename,
		icon: 'fas fa-i-cursor',
		action: () => rename(profileId),
	}, {
		text: ts._preferencesBackups.save,
		icon: 'fas fa-floppy-disk',
		action: () => save(profileId),
	}, null, {
		text: ts._preferencesBackups.delete,
		icon: 'fas fa-trash-can',
		action: () => deleteProfile(profileId),
		danger: true,
	}], ev.currentTarget ?? ev.target);
}

onMounted(() => {
	// streamingのuser storage updateイベントを監視して更新
	connection?.on('registryUpdated', ({ scope: recievedScope, key, value }) => {
		if (!recievedScope || recievedScope.length !== scope.length || recievedScope[0] !== scope[0]) return;
		if (!profiles) return;

		profiles[key] = value;
	});
});

onUnmounted(() => {
	connection?.off('registryUpdated');
});

definePageMetadata(computed(() => ({
	title: ts.preferencesBackups,
	icon: 'fas fa-floppy-disk',
	bg: 'var(--bg)',
})));
</script>

<style lang="scss" module>
.buttons {
	display: flex;
	gap: var(--margin);
	flex-wrap: wrap;
}

.profile {
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
