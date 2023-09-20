<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkLoading v-if="!loaded"/>
<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" appear>
	<div v-show="loaded" :class="$style.root">
		<img :src="serverErrorImageUrl" class="_ghost" :class="$style.img"/>
		<div class="_gaps">
			<div><b><i class="ti ti-alert-triangle"></i> {{ i18n.ts.pageLoadError }}</b></div>
			<div v-if="meta && (version === meta.version)">{{ i18n.ts.pageLoadErrorDescription }}</div>
			<div v-else-if="serverIsDead">{{ i18n.ts.serverIsDead }}</div>
			<template v-else>
				<div>{{ i18n.ts.newVersionOfClientAvailable }}</div>
				<div>{{ i18n.ts.youShouldUpgradeClient }}</div>
				<MkButton style="margin: 8px auto;" @click="reload">{{ i18n.ts.reload }}</MkButton>
			</template>
			<div><MkA to="/docs/general/troubleshooting" class="_link">{{ i18n.ts.troubleshooting }}</MkA></div>
			<div v-if="error" style="opacity: 0.7;">ERROR: {{ error }}</div>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { version } from '@/config.js';
import * as os from '@/os.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { miLocalStorage } from '@/local-storage.js';
import { defaultStore } from '@/store.js';
import { serverErrorImageUrl } from '@/instance.js';

const props = withDefaults(defineProps<{
	error?: Error;
}>(), {
});

let loaded = $ref(false);
let serverIsDead = $ref(false);
let meta = $ref<Misskey.entities.LiteInstanceMetadata | null>(null);

os.api('meta', {
	detail: false,
}).then(res => {
	loaded = true;
	serverIsDead = false;
	meta = res;
	miLocalStorage.setItem('v', res.version);
}, () => {
	loaded = true;
	serverIsDead = true;
});

function reload() {
	unisonReload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.error,
	icon: 'ti ti-alert-triangle',
});
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
}

.img {
	vertical-align: bottom;
	height: 128px;
	margin-bottom: 24px;
	border-radius: 16px;
}
</style>
