<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="word-break: auto-phrase; text-align: center; padding: 0 16px;">{{ i18n.ts._hana._tutorialMinorSettings.descriotion }}</div>

	<MkInfo>{{ i18n.ts._hana._tutorialMinorSettings.forMinor }}</MkInfo>

	<MkSwitch v-model="tlMuteSensitive">{{ i18n.ts._hana._tutorialMinorSettings.muteSensitive }}<template #caption>{{ i18n.ts._hana._tutorialMinorSettings.muteSensitiveDescription }}</template></MkSwitch>

	<MkSwitch v-model="confirmWhenRevealingSensitiveMedia">{{ i18n.ts.confirmWhenRevealingSensitiveMedia }}<template #caption>{{ i18n.ts._hana._tutorialMinorSettings.confirmWhenRevealingSensitiveMediaDescription }}</template></MkSwitch>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { i18n } from '@/i18n.js';
import { store } from '@/store.js';
import { deepMerge } from '@/utility/merge.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import type { TutorialPageCommonExpose } from '@/components/MkTutorial.vue';

// センシティブをミュートするほうがONなので、storeとは逆にする
const tlMuteSensitive = ref(!store.s.tl.filter.withSensitive);

const confirmWhenRevealingSensitiveMedia = computed(store.makeGetterSetter('confirmWhenRevealingSensitiveMedia'));

watch(tlMuteSensitive, (to) => {
	const out = deepMerge({ filter: { withSensitive: !to } }, store.s.tl);
	store.set('tl', out);
});

defineExpose<TutorialPageCommonExpose>({
	canContinue: true,
});
</script>

<style lang="scss" module>

</style>
