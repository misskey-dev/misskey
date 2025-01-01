<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" :class="$style.root" class="_link" :[attr]="self ? props.url.substring(local.length) : props.url" :rel="rel ?? 'nofollow noopener'" :target="target"
	:behavior="props.navigationBehavior"
	@contextmenu.stop="() => {}"
>
	<template v-if="!self">
		<span v-if="schema" :class="$style.schema">{{ schema }}//</span>
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
import { defineAsyncComponent, ref } from 'vue';
import { toUnicode as decodePunycode } from 'punycode/';
import { url as local } from '@@/js/config.js';
import * as os from '@/os.js';
import { useTooltip } from '@/scripts/use-tooltip.js';
import { isEnabledUrlPreview } from '@/instance.js';
import { MkABehavior } from '@/components/global/MkA.vue';

function safeURIDecode(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}

function ellipsize (v: string, size: number): string {
  try {
    if (size < v.length) {
      return v.slice(0, 16) + '…';
    }
    return v;
  } catch {
    return v;
  }
}

const props = withDefaults(defineProps<{
	url: string;
	rel?: string;
	showUrlPreview?: boolean;
	shorten?: boolean;
	navigationBehavior?: MkABehavior;
}>(), {
	showUrlPreview: true,
	shorten: false,
});

const self = props.url.startsWith(local);
const url = new URL(props.url);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid url');
const el = ref();

if (props.showUrlPreview && isEnabledUrlPreview.value) {
	useTooltip(el, (showing) => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkUrlPreviewPopup.vue')), {
			showing,
			url: props.url,
			source: el.value instanceof HTMLElement ? el.value : el.value?.$el,
		}, {
			closed: () => dispose(),
		});
	});
}

const schema = props.shorten ? null : url.protocol;
const hostname = decodePunycode(url.hostname);
const port = url.port;
const pathname = props.shorten ? ellipsize(safeURIDecode(url.pathname), 16) : safeURIDecode(url.pathname);
const query = props.shorten ? null : safeURIDecode(url.search);
const hash = props.shorten ? null : safeURIDecode(url.hash);
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
