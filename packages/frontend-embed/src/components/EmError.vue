<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<p :class="$style.text"><i class="ti ti-alert-triangle"></i> {{ i18n.ts.somethingHappened }}</p>
	<button class="_buttonGray _buttonRounded" :class="$style.button" @click="() => emit('retry')">{{ i18n.ts.retry }}</button>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'retry'): void;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
  align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.button {
	margin: 0 auto;
}

.img {
	vertical-align: bottom;
  width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}
</style>
