<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<div class="_gaps">
				<MkInfo warn :class="$style.warn">{{ i18n.ts.clientSettingOverridesWarn }}</MkInfo>
				<div v-if="fetching">
					<MkLoading/>
				</div>
				<div v-else class="_gaps_s">
					<MkInput v-model="query" type="search">
						<template #prefix><i class="ti ti-search"></i></template>
					</MkInput>

					<MkFolder
						v-for="def, key in clientSettingOverrides"
						:key="key"
						v-show="query === '' || key.toLowerCase().includes(query.toLowerCase())"
					>
						<template #label>{{ key }}</template>
						<template #suffix>
							<span v-if="def.enableOverride && def.overrideValue != null && def.overrideValue !== def.defaultValue" class="_warn">{{ i18n.ts.modified }}</span>
						</template>
						<div class="_gaps">
							<MkKeyValue>
								<template #key>{{ i18n.ts.default }}</template>
								<template #value>
									<MkCode v-bind="getMkCodeProps(def)"></MkCode>
								</template>
							</MkKeyValue>
							<MkSwitch v-model="def.enableOverride">{{ i18n.ts.enableOverride }}</MkSwitch>
							<MkInput v-if="def.formType === 'text'" v-model="def.overrideValue" :disabled="!def.enableOverride" type="text">
								<template #label>{{ i18n.ts.overrideValue }}</template>
							</MkInput>
							<MkInput v-else-if="def.formType === 'number'" v-model="def.overrideValue" :disabled="!def.enableOverride" type="number">
								<template #label>{{ i18n.ts.overrideValue }}</template>
							</MkInput>
							<MkSwitch v-else-if="def.formType === 'boolean'" v-model="def.overrideValue" :disabled="!def.enableOverride">
								<template #label>{{ i18n.ts.overrideValue }}</template>
								<template #caption>{{ i18n.ts.onToTrue }}</template>
							</MkSwitch>
							<MkTextarea v-else-if="def.formType === 'codeEditor'" v-model="def.overrideValue" :disabled="!def.enableOverride" pre>
								<template #label>{{ i18n.ts.overrideValue }}</template>
							</MkTextarea>
						</div>
					</MkFolder>
				</div>
			</div>
		</MkSpacer>
		<template #footer>
			<div :class="$style.footer">
				<div :class="$style.footerInner">
					<div class="_buttons">
						<MkButton primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton danger @click="reset"><i class="ti ti-trash"></i> {{ i18n.ts.reset }}</MkButton>
					</div>
				</div>
			</div>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import * as os from '@/os.js';
import { ColdDeviceStorage, defaultStore } from '@/store.js';
import { pruneInstanceCache } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkInfo from '@/components/MkInfo.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkCode from '@/components/MkCode.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';

const query = ref('');

const notConfigurableDefaultStoreSettings = [
	'accountSetupWizard',
	'timelineTutorials',
	'abusesTutorial',
	'memo',
	'mutedAds',
	'statusbars',
	'widgets',
	'pinnedUserLists',
	'recentlyUsedEmojis',
	'recentlyUsedUsers',
	'forceShowAds',
	'additionalUnicodeEmojiIndexes',
	'themeInitial',
] satisfies (keyof typeof defaultStore.def)[];

const notConfigurableColdDeviceStorageSettings = [
	'darkTheme',
	'lightTheme',
	'plugins',
] satisfies (keyof typeof ColdDeviceStorage.default)[];

type ClientSettingOverridesUIDefObj = {
	formType: 'text' | 'number' | 'boolean' | 'codeEditor';
	enableOverride: boolean;
	defaultValue: any;
	overrideValue?: any;
}

const fetching = ref(true);
const clientSettingOverrides = ref<Record<string, ClientSettingOverridesUIDefObj>>();

function getMkCodeProps(def: ClientSettingOverridesUIDefObj) {
	if (typeof def.defaultValue === 'string') {
		return {
			code: def.defaultValue,
			forceShow: true,
		};
	} else {
		return {
			code: JSON.stringify(def.defaultValue, null, 4),
			lang: 'json',
			forceShow: true,
		};
	}
}

function typeSafeObjectEntries<T extends Record<string, any>>(obj: T) {
	return Object.entries(obj) as [keyof T, T[keyof T]][];
}

function getClientSettingOverridesUIDefObj(def: unknown): ClientSettingOverridesUIDefObj {
	return {
		formType: (() => {
			if (typeof def === 'boolean') {
				return 'boolean';
			} else if (typeof def === 'number') {
				return 'number';
			} else if (typeof def === 'object') {
				return 'codeEditor';
			} else {
				return 'text';
			}
		})() satisfies ClientSettingOverridesUIDefObj['formType'] as ClientSettingOverridesUIDefObj['formType'],
		enableOverride: false,
		defaultValue: def,
		overrideValue: def,
	};
}

async function fetch() {
	fetching.value = true;
	const overrideDefs = Object.fromEntries([
		...typeSafeObjectEntries(defaultStore.def)
			.filter(([key, _]) => !(notConfigurableDefaultStoreSettings as string[]).includes(key))
			.map(([key, def]) => [`defaultStore::${key}`, getClientSettingOverridesUIDefObj(def.default)]),
		...typeSafeObjectEntries(ColdDeviceStorage.default)
			.filter(([key, _]) => !(notConfigurableColdDeviceStorageSettings as string[]).includes(key))
			.map(([key, def]) => [`ColdDeviceStorage::${key}`, getClientSettingOverridesUIDefObj(def)]),
	]);
	const res = await misskeyApi('admin/meta');
	if (res.defaultClientSettingOverrides != null) {
		try {
			const parsed = JSON.parse(res.defaultClientSettingOverrides);
			for (const key in parsed) {
				if (key in overrideDefs) {
					overrideDefs[key].enableOverride = true;
					overrideDefs[key].overrideValue = parsed[key];
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	clientSettingOverrides.value = overrideDefs;
	fetching.value = false;
}

async function save() {
	if (clientSettingOverrides.value == null) return;

	const overrides = Object.fromEntries(
		typeSafeObjectEntries(clientSettingOverrides.value)
			.filter(([key, def]) => (
				def.enableOverride &&
				def.overrideValue !== def.defaultValue && (
					(typeof def.defaultValue === 'string' && typeof def.overrideValue === 'string' && def.overrideValue !== def.defaultValue) ||
					(typeof def.defaultValue === 'object' && typeof def.overrideValue === 'string' && JSON.stringify(def.overrideValue) !== JSON.stringify(def.defaultValue)) ||
					(typeof def.defaultValue !== 'string' && typeof def.overrideValue === 'string' && def.overrideValue !== JSON.stringify(def.defaultValue))
				)
			))
			.map(([key, def]) => [key, typeof def.overrideValue === 'string' && typeof def.defaultValue !== 'string' ? JSON.parse(def.overrideValue) : def.overrideValue])
	);

	let defaultClientSettingOverrides: string | null = JSON.stringify(overrides);

	if (Object.keys(overrides).length === 0) {
		defaultClientSettingOverrides = null;
	}

	await os.apiWithDialog('admin/update-meta', {
		defaultClientSettingOverrides,
	});

	await fetch();
	pruneInstanceCache();
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting });
}

async function reset() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.resetAreYouSure,
	});

	if (canceled) return;

	await os.apiWithDialog('admin/update-meta', {
		defaultClientSettingOverrides: null,
	});

	await fetch();
}

fetch();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.clientSettingOverrides,
	icon: 'ti ti-checkbox',
}));
</script>

<style lang="scss" module>
.warn {
	white-space: pre-wrap;
}

.footer {
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	border-top: solid .5px var(--MI_THEME-divider);
}

.footerInner {
	max-width: 700px;
	margin: 0 auto;
	padding: 16px;
}
</style>
