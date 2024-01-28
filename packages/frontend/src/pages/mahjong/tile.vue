<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<img v-if="direction === 'v'" :src="`/client-assets/mahjong/tile-top-v.png`" :class="$style.bg"/>
	<img v-if="direction === 'h'" :src="`/client-assets/mahjong/tile-top-h.png`" :class="$style.bg"/>
	<img :src="`/client-assets/mahjong/tiles/${tile}.png`" :class="$style.fg"/>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Mahjong from 'misskey-mahjong';

const props = defineProps<{
	tile: Mahjong.Common.Tile;
	direction: 'v' | 'h';
}>();
</script>

<style lang="scss" module>
.root {
	display: inline-block;
	position: relative;
	width: 35px;
	aspect-ratio: 0.7;
}
.bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
}
.fg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 80%;
	object-fit: contain;
}
</style>
