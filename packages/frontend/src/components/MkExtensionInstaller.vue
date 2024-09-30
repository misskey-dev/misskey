<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m" :class="$style.extInstallerRoot">
	<div :class="$style.extInstallerIconWrapper">
		<i v-if="extension.type === 'plugin'" class="ti ti-plug"></i>
		<i v-else-if="extension.type === 'theme'" class="ti ti-palette"></i>
		<i v-else class="ti ti-download"></i>
	</div>
	<h2 :class="$style.extInstallerTitle">{{ i18n.ts._externalResourceInstaller[`_${extension.type}`].title }}</h2>
	<div :class="$style.extInstallerNormDesc">{{ i18n.ts._externalResourceInstaller.checkVendorBeforeInstall }}</div>
	<MkInfo v-if="extension.type === 'plugin'" :warn="true">{{ i18n.ts._plugin.installWarn }}</MkInfo>
	<FormSection>
		<template #label>{{ i18n.ts._externalResourceInstaller[`_${extension.type}`].metaTitle }}</template>
		<div class="_gaps_s">
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ i18n.ts.name }}</template>
					<template #value>{{ extension.meta.name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.author }}</template>
					<template #value>{{ extension.meta.author }}</template>
				</MkKeyValue>
			</FormSplit>
			<MkKeyValue v-if="extension.type === 'plugin'">
				<template #key>{{ i18n.ts.description }}</template>
				<template #value>{{ extension.meta.description }}</template>
			</MkKeyValue>
			<MkKeyValue v-if="extension.type === 'plugin'">
				<template #key>{{ i18n.ts.version }}</template>
				<template #value>{{ extension.meta.version }}</template>
			</MkKeyValue>
			<MkKeyValue v-if="extension.type === 'plugin'">
				<template #key>{{ i18n.ts.permission }}</template>
				<template #value>
					<ul :class="$style.extInstallerKVList">
						<li v-for="permission in extension.meta.permissions" :key="permission">{{ i18n.ts._permissions[permission] }}</li>
					</ul>
				</template>
			</MkKeyValue>
			<MkKeyValue v-if="extension.type === 'theme' && extension.meta.base">
				<template #key>{{ i18n.ts._externalResourceInstaller._meta.base }}</template>
				<template #value>{{ i18n.ts[extension.meta.base] }}</template>
			</MkKeyValue>
			<MkFolder>
				<template #icon><i class="ti ti-code"></i></template>
				<template #label>{{ i18n.ts._plugin.viewSource }}</template>

				<MkCode :code="extension.raw"/>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label>{{ i18n.ts._externalResourceInstaller._vendorInfo.title }}</template>
		<div class="_gaps_s">
			<MkKeyValue v-if="url">
				<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.endpoint }}</template>
				<template #value><MkUrl :url="url" :showUrlPreview="false"></MkUrl></template>
			</MkKeyValue>
			<MkKeyValue v-if="hashVerified">
				<!-- TODO: ハッシュ検証に失敗した場合の表示も作る -->
				<!-- その場合、hashVerifiedがfalseなら失敗表示、undefinedなら表示なしで分けたい -->
				<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.hashVerify }}</template>
				<template #value>
					<i class="ti ti-check" style="color: var(--accent)"></i>
				</template>
			</MkKeyValue>
		</div>
	</FormSection>
	<div class="_buttonsCenter">
		<MkButton primary @click="emits('confirm')"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
export type Extension = {
	type: 'plugin';
	raw: string;
	meta: {
		name: string;
		author: string;
		description?: string;
		version?: string;
		permissions?: string[];
		config?: Record<string, any>;
	};
} | {
	type: 'theme';
	raw: string;
	meta: {
		name: string;
		author: string;
		base?: 'light' | 'dark';
	};
};
</script>
<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import MkCode from '@/components/MkCode.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	extension: Extension;
	url?: string;
	hashVerified?: boolean;
}>();

const emits = defineEmits<{
	(ev: 'confirm'): void;
}>();
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
