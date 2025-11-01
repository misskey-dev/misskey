<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? EmA : 'a'" ref="el" :class="$style.root" class="_link" :[attr]="self ? props.url.substring(local.length) : props.url" :rel="rel ?? 'nofollow noopener'" :target="target"
	@contextmenu.stop="() => {}"
>
	<template v-if="!self">
		<span :class="$style.schema">{{ schema }}//</span>
		<span :class="$style.hostname">{{ hostname }}</span>
		<span v-if="port != ''">:{{ port }}</span>
	</template>
	<template v-if="pathname === '/' && self">
		<span :class="$style.self">{{ hostname }}</span>
	</template>
	<span v-if="pathname != ''" :class="$style.pathname">{{ self ? pathname.substring(1) : pathname }}</span>
	<span :class="$style.query">{{ query }}</span>
	<span :class="$style.hash">{{ hash }}</span>
	<i v-if="target === '_blank'" :class="$style.icon" class="ti ti-external-link"></i>
</component>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { toUnicode as decodePunycode } from 'punycode.js';
import EmA from './EmA.vue';
import { url as local } from '@@/js/config.js';

function safeURIDecode(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}

const props = withDefaults(defineProps<{
	url: string;
	rel?: string;
	showUrlPreview?: boolean;
}>(), {
	showUrlPreview: true,
});

const self = props.url.startsWith(local);
const url = new URL(props.url);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid url');
const el = ref();

const schema = url.protocol;
const hostname = decodePunycode(url.hostname);
const port = url.port;
const pathname = safeURIDecode(url.pathname);
const query = safeURIDecode(url.search);
const hash = safeURIDecode(url.hash);
const attr = self ? 'to' : 'href';
const target = self ? null : '_blank';
</script>

<style lang="scss" module>
.root {
	word-break: break-all;
}

.icon {
	padding-left: 2px;
	font-size: .9em;
}

.self {
	font-weight: bold;
}

.schema {
	opacity: 0.5;
}

.hostname {
	font-weight: bold;
}

.pathname {
	opacity: 0.8;
}

.query {
	opacity: 0.5;
}

.hash {
	font-style: italic;
}
</style>
