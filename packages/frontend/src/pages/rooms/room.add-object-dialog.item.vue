<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	class="_panel"
	:class="[$style.root]"
>
	<img :class="$style.thumbnail" :src="`/client-assets/world/object-thumbs/${camelToKebab(def.id)}.png`"/>
	<div :class="$style.name"><MkCondensedLine :minScale="0.5">{{ FURNITURE_UI_DEFS[def.id].name }}</MkCondensedLine></div>
	<i v-if="Object.keys(def.options.schema).length > 0" :class="$style.customizable" class="ti ti-tool"></i>
</div>
</template>

<script setup lang="ts">
import { camelToKebab } from 'misskey-world/src/utility.js';
import { FURNITURE_SCHEMA_DEFS } from 'misskey-world/src/room/object-schema-defs.js';
import { FURNITURE_UI_DEFS } from '@/world/room/object-ui-defs.js';

const props = defineProps<{
	def: typeof FURNITURE_SCHEMA_DEFS[string];
}>();
</script>

<style module>
.root {
	position: relative;
	padding: 12px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	cursor: pointer;
}
.selected {
	color: var(--MI_THEME-accent);
	background-color: var(--MI_THEME-accentedBg);
}

.thumbnail {
	width: 100%;
	aspect-ratio: 1;
}

.name {
	text-align: center;
}

.customizable {
	position: absolute;
	top: 10px;
	right: 10px;
	color: var(--MI_THEME-accent);
	opacity: 0.5;
}
</style>
