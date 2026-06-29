<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

⚠️ O'zbekcha: Xato sahifasi
Sahifa yuklanmay qolsa ko'rsatiladi
-->

<template>
<!-- Yuklash - ma'lumot so'raldi paytida -->
<MkLoading v-if="!loaded"/>
<Transition :name="prefer.s.animation ? '_transition_zoom' : ''" appear>
	<div v-show="loaded" :class="$style.root">
		<!-- Server xatosi rasmi (agar bor bo'lsa) -->
		<img v-if="instance.serverErrorImageUrl" :src="instance.serverErrorImageUrl" draggable="false" :class="$style.img"/>
		<div class="_gaps">
			<!-- Xato sarlavhasi -->
			<div><b><i class="ti ti-alert-triangle"></i> {{ i18n.ts.pageLoadError }}</b></div>
			<!-- Versiya tekshirish -->
			<div v-if="meta && (version === meta.version)">{{ i18n.ts.pageLoadErrorDescription }}</div>
			<!-- Server javob bermagan -->
			<div v-else-if="serverIsDead">{{ i18n.ts.serverIsDead }}</div>
			<!-- Yangi versiya mavjud -->
			<template v-else>
				<div>{{ i18n.ts.newVersionOfClientAvailable }}</div>
				<div>{{ i18n.ts.youShouldUpgradeClient }}</div>
				<!-- Qayta yuklash tugmasi -->
				<MkButton style="margin: 8px auto;" @click="reload">{{ i18n.ts.reload }}</MkButton>
			</template>
			<!-- Muammoni hal qilish ko'rsatmasi -->
			<div><MkLink url="https://misskey-hub.net/docs/for-users/resources/troubleshooting/" target="_blank">{{ i18n.ts.troubleshooting }}</MkLink></div>
			<!-- Xato ma'lumotlari (debug-uchun) -->
			<div v-if="error" style="opacity: 0.7;">XATO: {{ error }}</div>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { version } from '@@/js/config.js';
import MkButton from '@/components/MkButton.vue';
import MkLink from '@/components/MkLink.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { miLocalStorage } from '@/local-storage.js';
import { prefer } from '@/preferences.js';
import { instance } from '@/instance.js';

// Prop-lar: Xato ma'lumotlari
const props = withDefaults(defineProps<{
	error?: Error;
}>(), {
});

// State: Sahifa yuklanish holati
const loaded = ref(false);
// State: Server o'chirib-yoqilgang yoki tidak
const serverIsDead = ref(false);
// State: Server meta ma'lumotlari
const meta = ref<Misskey.entities.MetaResponse | null>(null);

// Server holatini tekshirish
misskeyApi('meta', {
	detail: false,
}).then(res => {
	loaded.value = true;
	serverIsDead.value = false;
	meta.value = res;
	// Versiya saqlash
	miLocalStorage.setItem('v', res.version);
}, () => {
	loaded.value = true;
	serverIsDead.value = true;
});

// Qayta yuklash funksiyasi
function reload() {
	unisonReload();
}

// Sarlavha tugmalari (bo'sh)
const headerActions = computed(() => []);

// Sarlavha varaqalari (bo'sh)
const headerTabs = computed(() => []);

// Sahifa ma'lumotlarini belgilash
definePage(() => ({
	title: i18n.ts.error,
	icon: 'ti ti-alert-triangle',
}));
</script>

<style lang="scss" module>
// Asosiy kontentni o'rta qilish
.root {
	padding: 32px;
	text-align: center;
}

// Xato rasmi
.img {
	vertical-align: bottom;
	height: 128px;
	margin-bottom: 24px;
	border-radius: 16px;
}
</style>
