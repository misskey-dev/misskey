<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.warn]: warn }]">
	<i v-if="warn" class="ti ti-alert-triangle" :class="$style.i"></i>
	<i v-else class="ti ti-info-circle" :class="$style.i"></i>
	<div><slot></slot></div>
	<button v-if="closable" :class="$style.button" class="_button" @click="close()"><i class="ti ti-x"></i></button>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	warn?: boolean;
	closable?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'close'): void;
}>();

function close() {
	// こいつの中では非表示動作は行わない
	emit('close');
}
</script>

<style lang="scss" module>
.root {
	display: flex;
  align-items: center;
	padding: 12px 14px;
	font-size: 90%;
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
	border-radius: var(--MI-radius);
	white-space: pre-wrap;

	&.warn {
		background: var(--MI_THEME-infoWarnBg);
		color: var(--MI_THEME-infoWarnFg);
	}
}

.i {
	margin-right: 4px;
}

.button {
	margin-left: auto;
	padding: 4px;
}
</style>
