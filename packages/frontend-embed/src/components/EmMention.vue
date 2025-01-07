<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :class="[$style.root]" :to="url">
	<span>
		<span>@{{ username }}</span>
		<span v-if="(host != localHost)" :class="$style.host">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
</template>

<script lang="ts" setup>
import { toUnicode } from 'punycode';
import { } from 'vue';
import { host as localHost } from 'frontend-shared/js/config';

const props = defineProps<{
	username: string;
	host: string;
}>();

const canonical = props.host === localHost ? `@${props.username}` : `@${props.username}@${toUnicode(props.host)}`;

const url = `/${canonical}`;
</script>

<style lang="scss" module>
.root {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--MI_THEME-mention);
	background-color: color-mix(in srgb, var(--MI_THEME-mention), transparent, 90%);
}

.host {
	opacity: 0.5;
}
</style>
