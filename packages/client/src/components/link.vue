<template>
<component :is="self ? 'MkA' : 'a'" ref="el" class="xlcxczvw _link" :[attr]="self ? url.substr(local.length) : url" :rel="rel" :target="target"
	:title="url"
>
	<slot></slot>
	<i v-if="target === '_blank'" class="fas fa-external-link-square-alt icon"></i>
</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import { url as local } from '@/config';
import { useTooltip } from '@/scripts/use-tooltip';
import * as os from '@/os';

const props = withDefaults(defineProps<{
	url: string;
	rel?: null | string;
}>(), {
});

const self = props.url.startsWith(local);
const attr = self ? 'to' : 'href';
const target = self ? null : '_blank';

const el = $ref();

useTooltip($$(el), (showing) => {
	os.popup(defineAsyncComponent(() => import('@/components/url-preview-popup.vue')), {
		showing,
		url: props.url,
		source: el,
	}, {}, 'closed');
});
</script>

<style lang="scss" scoped>
.xlcxczvw {
	word-break: break-all;

	> .icon {
		padding-left: 2px;
		font-size: .9em;
	}
}
</style>
