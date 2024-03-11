<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" style="word-break: break-all;" class="_link" :[attr]="self ? url.substring(local.length) : url" :rel="rel ?? 'nofollow noopener'" :target="target"
	:title="url" @click.prevent.stop="alertOtherHost"
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
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	url: string;
	rel?: null | string;
}>(), {
});

const self = props.url.startsWith(local);
const attr = self ? 'to' : 'href';
const target = self ? undefined : '_blank';

const el = ref<HTMLElement>();

useTooltip(el, (showing) => {
	os.popup(defineAsyncComponent(() => import('@/components/MkUrlPreviewPopup.vue')), {
		showing,
		url: props.url,
		source: el.value,
	}, {}, 'closed');
});

async function alertOtherHost() {
	if(defaultStore.state.checkRedirectingOtherHost && !self) {
		// show confirm dialog when redirecting other host
		const confirm = await os.confirm({
			type: 'warning',
			title: i18n.ts.warningRedirectingOtherHost,
			text: props.url,
		});
		if (confirm.canceled) return;
		return;
	}
	window.open(props.url, target, props.rel ?? 'nofollow noopener');
}
</script>

<style lang="scss" module>
.icon {
	padding-left: 2px;
	font-size: .9em;
}
</style>
