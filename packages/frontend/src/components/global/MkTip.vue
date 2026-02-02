<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="!store.r.tips.value[props.k]" :class="[$style.root, { [$style.warn]: warn }]" class="_selectable _gaps_s">
	<div style="font-weight: bold;"><i class="ti ti-bulb"></i> {{ i18n.ts.tip }}:</div>
	<div><slot></slot></div>
	<div>
		<MkButton inline primary rounded small @click="_closeTip()"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
		<button class="_button" style="padding: 8px; margin-left: 4px;" @click="showMenu"><i class="ti ti-dots"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { store } from '@/store.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { TIPS, hideAllTips, closeTip } from '@/tips.js';

const props = withDefaults(defineProps<{
	k: typeof TIPS[number];
	warn?: boolean;
}>(), {
	warn: false,
});

function _closeTip() {
	closeTip(props.k);
}

function showMenu(ev: PointerEvent) {
	os.popupMenu([{
		icon: 'ti ti-bulb-off',
		text: i18n.ts.hideAllTips,
		danger: true,
		action: () => {
			hideAllTips();
			os.success();
		},
	}], ev.currentTarget ?? ev.target);
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
