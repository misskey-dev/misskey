<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="!store.r.tips.value[props.k]" :class="[$style.root, { [$style.warn]: warn }]" class="_selectable _gaps_s">
	<div style="font-weight: bold;"><i class="ti ti-bulb"></i> {{ i18n.ts.tip }}:</div>
	<div><slot></slot></div>
	<MkButton primary rounded small @click="closeTip()"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { store } from '@/store.js';
import MkButton from '@/components/MkButton.vue';

const props = withDefaults(defineProps<{
	k: keyof (typeof store['s']['tips']);
	warn?: boolean;
}>(), {
	warn: false,
});

function closeTip() {
	store.set('tips', {
		...store.r.tips.value,
		[props.k]: true,
	});
}
</script>

<style lang="scss" module>
.root {
	padding: 12px 14px;
	font-size: 90%;
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
	border-radius: var(--MI-radius);

	&.warn {
		background: var(--MI_THEME-infoWarnBg);
		color: var(--MI_THEME-infoWarnFg);
	}
}

</style>
