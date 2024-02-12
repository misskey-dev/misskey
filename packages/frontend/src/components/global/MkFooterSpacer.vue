<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.spacer, defaultStore.reactiveState.darkMode.value ? $style.dark : $style.light]"></div>
</template>

<script lang="ts" setup>
import { defaultStore } from '@/store.js';
</script>

<style lang="scss" module>
.spacer {
	box-sizing: border-box;
	padding: 32px;
	margin: 0 auto;
	height: 300px;
	background-clip: content-box;
	background-size: auto auto;
	background-color: rgba(255, 255, 255, 0);

	&.light {
		background-image: repeating-linear-gradient(135deg, transparent, transparent 16px, #00000010 16px, #00000010 20px );
	}

	&.dark {
		background-image: repeating-linear-gradient(135deg, transparent, transparent 16px, #FFFFFF16 16px, #FFFFFF16 20px );
	}
}
</style>
