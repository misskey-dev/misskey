<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div class="_spacer" style="--MI_SPACER-w: 550px; --MI_SPACER-max: 50px;">
		<MkLoading v-if="uiPhase === 'fetching'"/>
		<MkExtensionInstaller v-else-if="uiPhase === 'confirm' && data" :extension="data" @confirm="install()" @cancel="close_()">
			<template #additionalInfo>
				<FormSection>
					<div class="_gaps_s">
						<MkKeyValue>
							<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.endpoint }}</template>
							<template #value><MkUrl v-if="url" :url="url" :showUrlPreview="false"></MkUrl></template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.hashVerify }}</template>
							<template #value>
								<!-- この画面が出ている時点でハッシュの検証には成功している -->
								<i class="ti ti-check" style="color: var(--MI_THEME-accent)"></i>
							</template>
						</MkKeyValue>
					</div>
				</FormSection>
			</template>
		</MkExtensionInstaller>
		<div v-else-if="uiPhase === 'error'" class="_gaps_m" :class="[$style.extInstallerRoot, $style.error]">
			<div :class="$style.extInstallerIconWrapper">
				<i class="ti ti-circle-x"></i>
			</div>
			<h2 :class="$style.extInstallerTitle">{{ errorKV?.title }}</h2>
			<div :class="$style.extInstallerNormDesc">{{ errorKV?.description }}</div>
			<div class="_buttonsCenter">
				<MkButton @click="close_()">{{ i18n.ts.close }}</MkButton>
			</div>
		</div>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import type { Extension } from '@/components/MkExtensionInstaller.vue';
import type { AiScriptPluginMeta } from '@/plugin.js';
import MkLoading from '@/components/global/MkLoading.vue';
import MkExtensionInstaller from '@/components/MkExtensionInstaller.vue';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { parsePluginMeta, installPlugin } from '@/plugin.js';
import { parseThemeCode, installTheme } from '@/theme.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

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

const data = ref<Extension | null>(null);

function close_(): void {
	if (window.history.length === 1) {
		window.close();
	} else {
		window.history.back();
	}
}

async function _fetch_() {
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

				const { id, props, desc: description, ...meta } = metaRaw;
				data.value = {
					type: 'theme',
					meta: {
						// description, // 使用されていない
						...meta,
					},
					raw: res.data,
				};
			} catch (err) {
				if (!(err instanceof Error)) {
					throw err;
				}

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
				window.setTimeout(() => {
					close_();
				}, 3000);
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
			window.setTimeout(() => {
				close_();
			}, 3000);
	}
}

const urlParams = new URLSearchParams(window.location.search);
url.value = urlParams.get('url');
hash.value = urlParams.get('hash');
_fetch_();

definePage(() => ({
	title: i18n.ts._externalResourceInstaller.title,
	icon: 'ti ti-download',
}));
</script>

<style lang="scss" module>
.extInstallerRoot {
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
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

	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
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
</style>
