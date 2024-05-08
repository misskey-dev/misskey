<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="500">
		<MkLoading v-if="uiPhase === 'fetching'"/>
		<div v-else-if="uiPhase === 'confirm' && data" class="_gaps_m" :class="$style.extInstallerRoot">
			<div :class="$style.extInstallerIconWrapper">
				<i v-if="data.type === 'plugin'" class="ti ti-plug"></i>
				<i v-else-if="data.type === 'theme'" class="ti ti-palette"></i>
				<i v-else class="ti ti-download"></i>
			</div>
			<h2 :class="$style.extInstallerTitle">{{ i18n.ts._externalResourceInstaller[`_${data.type}`].title }}</h2>
			<div :class="$style.extInstallerNormDesc">{{ i18n.ts._externalResourceInstaller.checkVendorBeforeInstall }}</div>
			<MkInfo v-if="data.type === 'plugin'" :warn="true">{{ i18n.ts._plugin.installWarn }}</MkInfo>
			<FormSection>
				<template #label>{{ i18n.ts._externalResourceInstaller[`_${data.type}`].metaTitle }}</template>
				<div class="_gaps_s">
					<FormSplit>
						<MkKeyValue>
							<template #key>{{ i18n.ts.name }}</template>
							<template #value>{{ data.meta?.name }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ i18n.ts.author }}</template>
							<template #value>{{ data.meta?.author }}</template>
						</MkKeyValue>
					</FormSplit>
					<MkKeyValue v-if="data.type === 'plugin'">
						<template #key>{{ i18n.ts.description }}</template>
						<template #value>{{ data.meta?.description }}</template>
					</MkKeyValue>
					<MkKeyValue v-if="data.type === 'plugin'">
						<template #key>{{ i18n.ts.version }}</template>
						<template #value>{{ data.meta?.version }}</template>
					</MkKeyValue>
					<MkKeyValue v-if="data.type === 'plugin'">
						<template #key>{{ i18n.ts.permission }}</template>
						<template #value>
							<ul :class="$style.extInstallerKVList">
								<li v-for="permission in data.meta?.permissions" :key="permission">{{ i18n.ts._permissions[permission] }}</li>
							</ul>
						</template>
					</MkKeyValue>
					<MkKeyValue v-if="data.type === 'theme' && data.meta?.base">
						<template #key>{{ i18n.ts._externalResourceInstaller._meta.base }}</template>
						<template #value>{{ i18n.ts[data.meta.base] }}</template>
					</MkKeyValue>
					<MkFolder>
						<template #icon><i class="ti ti-code"></i></template>
						<template #label>{{ i18n.ts._plugin.viewSource }}</template>

						<MkCode :code="data.raw ?? ''"/>
					</MkFolder>
				</div>
			</FormSection>
			<FormSection>
				<template #label>{{ i18n.ts._externalResourceInstaller._vendorInfo.title }}</template>
				<div class="_gaps_s">
					<MkKeyValue>
						<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.endpoint }}</template>
						<template #value><MkUrl :url="url ?? ''" :showUrlPreview="false"></MkUrl></template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.hashVerify }}</template>
						<template #value>
							<!--この画面が出ている時点でハッシュの検証には成功している-->
							<i class="ti ti-check" style="color: var(--accent)"></i>
						</template>
					</MkKeyValue>
				</div>
			</FormSection>
			<div class="_buttonsCenter">
				<MkButton primary @click="install()"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
			</div>
		</div>
		<div v-else-if="uiPhase === 'error'" class="_gaps_m" :class="[$style.extInstallerRoot, $style.error]">
			<div :class="$style.extInstallerIconWrapper">
				<i class="ti ti-circle-x"></i>
			</div>
			<h2 :class="$style.extInstallerTitle">{{ errorKV?.title }}</h2>
			<div :class="$style.extInstallerNormDesc">{{ errorKV?.description }}</div>
			<div class="_buttonsCenter">
				<MkButton @click="goBack()">{{ i18n.ts.goBack }}</MkButton>
				<MkButton @click="goToMisskey()">{{ i18n.ts.goToMisskey }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onActivated, onDeactivated, nextTick } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import MkCode from '@/components/MkCode.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { AiScriptPluginMeta, parsePluginMeta, installPlugin } from '@/scripts/install-plugin.js';
import { parseThemeCode, installTheme } from '@/scripts/install-theme.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const uiPhase = ref<'fetching' | 'confirm' | 'error'>('fetching');
const errorKV = ref<{
	title?: string;
	description?: string;
}>({
	title: '',
	description: '',
});

const url = ref<string | null>(null);
const hash = ref<string | null>(null);

const data = ref<{
	type: 'plugin' | 'theme';
	raw: string;
	meta?: {
		// Plugin & Theme Common
		name: string;
		author: string;

		// Plugin
		description?: string;
		version?: string;
		permissions?: string[];
		config?: Record<string, any>;

		// Theme
		base?: 'light' | 'dark';
	};
} | null>(null);

function goBack(): void {
	history.back();
}

function goToMisskey(): void {
	location.href = '/';
}

async function fetch() {
	if (!url.value || !hash.value) {
		errorKV.value = {
			title: i18n.ts._externalResourceInstaller._errors._invalidParams.title,
			description: i18n.ts._externalResourceInstaller._errors._invalidParams.description,
		};
		uiPhase.value = 'error';
		return;
	}
	const res = await misskeyApi('fetch-external-resources', {
		url: url.value,
		hash: hash.value,
	}).catch((err) => {
		switch (err.id) {
			case 'bb774091-7a15-4a70-9dc5-6ac8cf125856':
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._failedToFetch.title,
					description: i18n.ts._externalResourceInstaller._errors._failedToFetch.parseErrorDescription,
				};
				uiPhase.value = 'error';
				break;
			case '693ba8ba-b486-40df-a174-72f8279b56a4':
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._hashUnmatched.title,
					description: i18n.ts._externalResourceInstaller._errors._hashUnmatched.description,
				};
				uiPhase.value = 'error';
				break;
			default:
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._failedToFetch.title,
					description: i18n.ts._externalResourceInstaller._errors._failedToFetch.fetchErrorDescription,
				};
				uiPhase.value = 'error';
				break;
		}
		throw new Error(err.code);
	});

	if (!res) {
		errorKV.value = {
			title: i18n.ts._externalResourceInstaller._errors._failedToFetch.title,
			description: i18n.ts._externalResourceInstaller._errors._failedToFetch.fetchErrorDescription,
		};
		uiPhase.value = 'error';
		return;
	}

	switch (res.type) {
		case 'plugin':
			try {
				const meta = await parsePluginMeta(res.data);
				data.value = {
					type: 'plugin',
					meta,
					raw: res.data,
				};
			} catch (err) {
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._pluginParseFailed.title,
					description: i18n.ts._externalResourceInstaller._errors._pluginParseFailed.description,
				};
				console.error(err);
				uiPhase.value = 'error';
				return;
			}
			break;

		case 'theme':
			try {
				const metaRaw = parseThemeCode(res.data);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, props, desc: description, ...meta } = metaRaw;
				data.value = {
					type: 'theme',
					meta: {
						description,
						...meta,
					},
					raw: res.data,
				};
			} catch (err) {
				switch (err.message.toLowerCase()) {
					case 'this theme is already installed':
						errorKV.value = {
							title: i18n.ts._externalResourceInstaller._errors._themeParseFailed.title,
							description: i18n.ts._theme.alreadyInstalled,
						};
						break;

					default:
						errorKV.value = {
							title: i18n.ts._externalResourceInstaller._errors._themeParseFailed.title,
							description: i18n.ts._externalResourceInstaller._errors._themeParseFailed.description,
						};
						break;
				}
				console.error(err);
				uiPhase.value = 'error';
				return;
			}
			break;

		default:
			errorKV.value = {
				title: i18n.ts._externalResourceInstaller._errors._resourceTypeNotSupported.title,
				description: i18n.ts._externalResourceInstaller._errors._resourceTypeNotSupported.description,
			};
			uiPhase.value = 'error';
			return;
	}

	uiPhase.value = 'confirm';
}

async function install() {
	if (!data.value) return;

	switch (data.value.type) {
		case 'plugin':
			if (!data.value.meta) return;
			try {
				await installPlugin(data.value.raw, data.value.meta as AiScriptPluginMeta);
				os.success();
				nextTick(() => {
					unisonReload('/');
				});
			} catch (err) {
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._pluginInstallFailed.title,
					description: i18n.ts._externalResourceInstaller._errors._pluginInstallFailed.description,
				};
				console.error(err);
				uiPhase.value = 'error';
			}
			break;
		case 'theme':
			if (!data.value.meta) return;
			await installTheme(data.value.raw);
			os.success();
			nextTick(() => {
				location.href = '/settings/theme';
			});
	}
}

onActivated(() => {
	const urlParams = new URLSearchParams(window.location.search);
	url.value = urlParams.get('url');
	hash.value = urlParams.get('hash');
	fetch();
});

onDeactivated(() => {
	uiPhase.value = 'fetching';
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts._externalResourceInstaller.title,
	icon: 'ti ti-download',
}));
</script>

<style lang="scss" module>
.extInstallerRoot {
	border-radius: var(--radius);
	background: var(--panel);
	padding: 1.5rem;
}

.extInstallerIconWrapper {
	width: 48px;
	height: 48px;
	font-size: 24px;
	line-height: 48px;
	text-align: center;
	border-radius: 50%;
	margin-left: auto;
	margin-right: auto;

	background-color: var(--accentedBg);
	color: var(--accent);
}

.error .extInstallerIconWrapper {
	background-color: rgba(255, 42, 42, .15);
	color: #ff2a2a;
}

.extInstallerTitle {
	font-size: 1.2rem;
	text-align: center;
	margin: 0;
}

.extInstallerNormDesc {
	text-align: center;
}

.extInstallerKVList {
	margin-top: 0;
	margin-bottom: 0;
}
</style>
