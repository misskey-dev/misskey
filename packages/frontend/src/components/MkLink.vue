<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" style="word-break: break-all;" class="_link" :[attr]="maybeRelativeUrl" :rel="rel ?? 'nofollow noopener'" :target="target"
	:behavior="props.navigationBehavior"
	:title="url"
>
	<slot></slot>
	<i v-if="target === '_blank'" class="ti ti-external-link" :class="$style.icon"></i>
</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { url as local } from '@@/js/config.js';
import { maybeMakeRelative } from '@@/js/url.js';
import type { MkABehavior } from '@/components/global/MkA.vue';
import { useTooltip } from '@/composables/use-tooltip.js';
import * as os from '@/os.js';
import { isEnabledUrlPreview } from '@/utility/url-preview.js';

const props = withDefaults(defineProps<{
	url: string;
	rel?: null | string;
	navigationBehavior?: MkABehavior;
}>(), {
});

const maybeRelativeUrl = maybeMakeRelative(props.url, local);
const self = maybeRelativeUrl !== props.url;
const attr = self ? 'to' : 'href';
const target = self ? null : '_blank';

const el = ref<HTMLElement | { $el: HTMLElement }>();

if (isEnabledUrlPreview.value) {
	useTooltip(el, (showing) => {
		const anchorElement = el.value instanceof HTMLElement ? el.value : el.value?.$el;
		if (anchorElement == null) return;
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkUrlPreviewPopup.vue')), {
			showing,
			url: props.url,
			anchorElement: anchorElement,
		}, {
			closed: () => dispose(),
		});
	});
}
</script>

<style lang="scss" module>
.icon {
	padding-left: 2px;
	font-size: .9em;
}
</style>
