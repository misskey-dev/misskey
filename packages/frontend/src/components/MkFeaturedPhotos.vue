<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance" :class="$style.root" :style="{ backgroundImage: `url(${ instance.backgroundImageUrl })` }"></div>
</template>

<script lang="ts" setup>
import { instance } from '@/instance.js';
</script>

<style lang="scss" module>
.root {
	background-position: center;
	background-size: cover;
}
</style>
