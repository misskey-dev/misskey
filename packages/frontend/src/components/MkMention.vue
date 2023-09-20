<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA v-user-preview="canonical" :class="[$style.root, { [$style.isMe]: isMe }]" :to="url" :style="{ background: bgCss }">
	<img :class="$style.icon" :src="`/avatar/@${username}@${host}`" alt="">
	<span>
		<span>@{{ username }}</span>
		<span v-if="(host != localHost) || defaultStore.state.showFullAcct" :class="$style.host">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
</template>

<script lang="ts" setup>
import { toUnicode } from 'punycode';
import { } from 'vue';
import tinycolor from 'tinycolor2';
import { host as localHost } from '@/config.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';

const props = defineProps<{
	username: string;
	host: string;
}>();

const canonical = props.host === localHost ? `@${props.username}` : `@${props.username}@${toUnicode(props.host)}`;

const url = `/${canonical}`;

const isMe = $i && (
	`@${props.username}@${toUnicode(props.host)}` === `@${$i.username}@${toUnicode(localHost)}`.toLowerCase()
);

const bg = tinycolor(getComputedStyle(document.documentElement).getPropertyValue(isMe ? '--mentionMe' : '--mention'));
bg.setAlpha(0.1);
const bgCss = bg.toRgbString();
</script>

<style lang="scss" module>
.root {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--mention);

	&.isMe {
		color: var(--mentionMe);
	}
}

.icon {
	width: 1.5em;
	height: 1.5em;
	object-fit: cover;
	margin: 0 0.2em 0 0;
	vertical-align: bottom;
	border-radius: 100%;
}

.host {
	opacity: 0.5;
}
</style>
