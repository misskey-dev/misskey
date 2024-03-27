<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" style="word-break: break-all;" class="_link" :[attr]="self ? url.substring(local.length) : url" :rel="rel" :target="target"
	:title="url" @click="(ev: MouseEvent) => warningExternalWebsite(ev, props.url)"
>
	<slot></slot>
	<i v-if="target === '_blank'" class="ti ti-external-link" :class="$style.icon"></i>
</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { url as local } from '@/config.js';
import { useTooltip } from '@/scripts/use-tooltip.js';
import * as os from '@/os.js';
import { isEnabledUrlPreview } from '@/instance.js';
import { warningExternalWebsite } from '@/scripts/warning-external-website.js';

const props = withDefaults(defineProps<{
	url: string;
	rel?: null | string;
}>(), {
	rel: 'nofollow noopener',
});

// eslint-disable-next-line vue/no-setup-props-destructure
const self = props.url.startsWith(local);
const attr = self ? 'to' : 'href';
const target = self ? undefined : '_blank';

const el = ref<HTMLElement | { $el: HTMLElement }>();

if (isEnabledUrlPreview.value) {
	useTooltip(el, (showing) => {
		os.popup(defineAsyncComponent(() => import('@/components/MkUrlPreviewPopup.vue')), {
			showing,
			url: props.url,
			source: el.value instanceof HTMLElement ? el.value : el.value?.$el,
		}, {}, 'closed');
	});
}
</script>

<style lang="scss" module>
.icon {
	padding-left: 2px;
	font-size: .9em;
}
</style>
