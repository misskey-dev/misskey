<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :class="[$style.root]" :to="url" :style="{ background: bgCss }">
	<span>
		<span>@{{ username }}</span>
		<span v-if="(host != localHost)" :class="$style.host">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
</template>

<script lang="ts" setup>
import { toUnicode } from 'punycode.js';
import { } from 'vue';
import tinycolor from 'tinycolor2';
import { host as localHost } from '@@/js/config.js';

const props = defineProps<{
	username: string;
	host: string;
}>();

const canonical = props.host === localHost ? `@${props.username}` : `@${props.username}@${toUnicode(props.host)}`;

const url = `/${canonical}`;

const bg = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--MI_THEME-mention'));
bg.setAlpha(0.1);
const bgCss = bg.toRgbString();
</script>

<style lang="scss" module>
.root {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--MI_THEME-mention);
}

.host {
	opacity: 0.5;
}
</style>
