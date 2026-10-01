<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" :class="$style.root" class="_link" :[attr]="maybeRelativeUrl" :rel="rel ?? 'nofollow noopener'" :target="target"
	:behavior="props.navigationBehavior"
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
import { computed, defineAsyncComponent, ref } from 'vue';
import { toUnicode as decodePunycode } from 'punycode.js';
import { url as local } from '@@/js/config.js';
import { maybeMakeRelative } from '@@/js/url.js';
import type { MkABehavior } from '@/components/global/MkA.vue';
import * as os from '@/os.js';
import { useTooltip } from '@/composables/use-tooltip.js';
import { isEnabledUrlPreview } from '@/utility/url-preview.js';

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
	navigationBehavior?: MkABehavior;
}>(), {
	showUrlPreview: true,
});

const maybeRelativeUrl = computed(() => maybeMakeRelative(props.url, local));
const self = computed(() => maybeRelativeUrl.value !== props.url);
const url = computed(() => {
	const parsed = new URL(props.url);
	if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid url');
	return parsed;
});
const el = ref();

if (props.showUrlPreview && isEnabledUrlPreview.value) {
	useTooltip(el, (showing) => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkUrlPreviewPopup.vue')), {
			showing,
			url: props.url,
			anchorElement: el.value instanceof HTMLElement ? el.value : el.value?.$el,
		}, {
			closed: () => dispose(),
		});
	});
}

const schema = computed(() => url.value.protocol);
const hostname = computed(() => decodePunycode(url.value.hostname));
const port = computed(() => url.value.port);
const pathname = computed(() => safeURIDecode(url.value.pathname));
const query = computed(() => safeURIDecode(url.value.search));
const hash = computed(() => safeURIDecode(url.value.hash));
const attr = computed(() => (self.value ? 'to' : 'href'));
const target = computed(() => (self.value ? null : '_blank'));
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
	color: color(from currentcolor srgb r g b / 0.5); // DOMノード全体をopacityで半透明化するより文字色を半透明化した方が若干レンダリングパフォーマンスが良い
}

.hostname {
	font-weight: bold;
}

.pathname {
	color: color(from currentcolor srgb r g b / 0.8); // DOMノード全体をopacityで半透明化するより文字色を半透明化した方が若干レンダリングパフォーマンスが良い
}

.query {
	color: color(from currentcolor srgb r g b / 0.5); // DOMノード全体をopacityで半透明化するより文字色を半透明化した方が若干レンダリングパフォーマンスが良い
}

.hash {
	font-style: italic;
}
</style>
