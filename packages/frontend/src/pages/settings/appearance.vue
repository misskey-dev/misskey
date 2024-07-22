<template>
<div class="_gaps_m">
	<div class="_gaps_s">
		<MkSwitch v-model="reduceAnimation">{{ i18n.ts.reduceUiAnimation }}</MkSwitch>
		<MkSwitch v-model="useBlurEffect">{{ i18n.ts.useBlurEffect }}</MkSwitch>
		<MkSwitch v-model="useBlurEffectForModal">{{ i18n.ts.useBlurEffectForModal }}</MkSwitch>
		<MkSwitch v-model="disableShowingAnimatedImages">{{ i18n.ts.disableShowingAnimatedImages }}</MkSwitch>
		<MkSwitch v-model="highlightSensitiveMedia">{{ i18n.ts.highlightSensitiveMedia }}</MkSwitch>
		<MkSwitch v-model="squareAvatars">{{ i18n.ts.squareAvatars }}</MkSwitch>
		<MkSwitch v-model="showAvatarDecorations">{{ i18n.ts.showAvatarDecorations }}</MkSwitch>
		<MkSwitch v-model="useSystemFont">{{ i18n.ts.useSystemFont }}</MkSwitch>
		<MkSwitch v-model="disableDrawer">{{ i18n.ts.disableDrawer }}</MkSwitch>
		<MkSwitch v-model="forceShowAds">{{ i18n.ts.forceShowAds }}</MkSwitch>
		<MkSwitch v-model="enableGamingMode">{{ i18n.ts.gamingMode }} <template #caption>{{ i18n.ts.gamingModeInfo }} </template></MkSwitch>
		<MkSwitch v-model="enableonlyAndWithSave">{{ i18n.ts.onlyAndWithSave }}<template #caption>{{ i18n.ts.onlyAndWithSaveInfo }} </template></MkSwitch>
		<MkSwitch v-model="enablehanntenn">{{ i18n.ts.hanntenn }}<template #caption>{{ i18n.ts.hanntennInfo }} </template></MkSwitch>
		<MkSwitch v-model="enableSeasonalScreenEffect">{{ i18n.ts.seasonalScreenEffect }}</MkSwitch>
		<MkSwitch v-model="useNativeUIForVideoAudioPlayer">{{ i18n.ts.useNativeUIForVideoAudioPlayer }}</MkSwitch>
	</div>
	<div>
		<MkRadios v-model="emojiStyle">
			<template #label>{{ i18n.ts.emojiStyle }}</template>
			<option value="native">{{ i18n.ts.native }}</option>
			<option value="fluentEmoji">Fluent Emoji</option>
			<option value="twemoji">Twemoji</option>
		</MkRadios>
		<div style="margin: 8px 0 0 0; font-size: 1.5em;"><Mfm :key="emojiStyle" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
	</div>

	<MkRadios v-model="fontSize">
		<template #label>{{ i18n.ts.fontSize }}</template>
		<option :value="null"><span style="font-size: 14px;">Aa</span></option>
		<option value="1"><span style="font-size: 15px;">Aa</span></option>
		<option value="2"><span style="font-size: 16px;">Aa</span></option>
		<option value="3"><span style="font-size: 17px;">Aa</span></option>
	</MkRadios>
</div>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue';
import { i18n } from '@/i18n.js';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { defaultStore } from '@/store.js';
import { miLocalStorage } from '@/local-storage.js';
import * as os from '@/os.js';

import { unisonReload } from '@/scripts/unison-reload.js';
const fontSize = ref(miLocalStorage.getItem('fontSize'));

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

const reduceAnimation = computed(defaultStore.makeGetterSetter('animation', v => !v, v => !v));
const useBlurEffectForModal = computed(defaultStore.makeGetterSetter('useBlurEffectForModal'));
const useBlurEffect = computed(defaultStore.makeGetterSetter('useBlurEffect'));
const disableShowingAnimatedImages = computed(defaultStore.makeGetterSetter('disableShowingAnimatedImages'));
const highlightSensitiveMedia = computed(defaultStore.makeGetterSetter('highlightSensitiveMedia'));
const squareAvatars = computed(defaultStore.makeGetterSetter('squareAvatars'));
const showAvatarDecorations = computed(defaultStore.makeGetterSetter('showAvatarDecorations'));
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);
const disableDrawer = computed(defaultStore.makeGetterSetter('disableDrawer'));
const forceShowAds = computed(defaultStore.makeGetterSetter('forceShowAds'));
const enableGamingMode = computed(defaultStore.makeGetterSetter('gamingMode'));
const enableonlyAndWithSave = computed(defaultStore.makeGetterSetter('onlyAndWithSave'));
const enablehanntenn = computed(defaultStore.makeGetterSetter('enablehanntenn'));
const enableSeasonalScreenEffect = computed(defaultStore.makeGetterSetter('enableSeasonalScreenEffect'));
const useNativeUIForVideoAudioPlayer = computed(defaultStore.makeGetterSetter('useNativeUIForVideoAudioPlayer'));
const emojiStyle = computed(defaultStore.makeGetterSetter('emojiStyle'));

watch(fontSize, () => {
	if (fontSize.value == null) {
		miLocalStorage.removeItem('fontSize');
	} else {
		miLocalStorage.setItem('fontSize', fontSize.value);
	}
});

watch(useSystemFont, () => {
	if (useSystemFont.value) {
		miLocalStorage.setItem('useSystemFont', 't');
	} else {
		miLocalStorage.removeItem('useSystemFont');
	}
});

watch([
	fontSize,
	useSystemFont,
	squareAvatars,
	highlightSensitiveMedia,
	enableonlyAndWithSave,
	enableSeasonalScreenEffect,
], async () => {
	await reloadAsk();
});

</script>

<style scoped lang="scss">

</style>
