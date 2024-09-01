<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="{ backgroundImage: `url(${ serverMetadata.backgroundImageUrl })` }"></div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { DI } from '@/di.js';

const serverMetadata = inject(DI.serverMetadata);
</script>

<style lang="scss" module>
.root {
	background-position: center;
	background-size: cover;
}
</style>
