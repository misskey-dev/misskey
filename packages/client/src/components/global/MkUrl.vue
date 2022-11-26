<template>
<component
	:is="self ? 'MkA' : 'a'" ref="el" class="ieqqeuvs _link" :[attr]="self ? props.url.substring(local.length) : props.url" :rel="rel" :target="target"
	@contextmenu.stop="() => {}"
>
	<template v-if="!self">
		<span class="schema">{{ schema }}//</span>
		<span class="hostname">{{ hostname }}</span>
		<span v-if="port != ''" class="port">:{{ port }}</span>
	</template>
	<template v-if="pathname === '/' && self">
		<span class="self">{{ hostname }}</span>
	</template>
	<span v-if="pathname != ''" class="pathname">{{ self ? pathname.substring(1) : pathname }}</span>
	<span class="query">{{ query }}</span>
	<span class="hash">{{ hash }}</span>
	<i v-if="target === '_blank'" class="fas fa-external-link-square-alt icon"></i>
</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { toUnicode as decodePunycode } from 'punycode/';
import { url as local } from '@/config';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip';
import { safeURIDecode } from '@/scripts/safe-uri-decode';

const props = defineProps<{
	url: string;
	rel?: string;
}>();

const self = props.url.startsWith(local);
const url = new URL(props.url);
const el = ref();

useTooltip(el, (showing) => {
	os.popup(defineAsyncComponent(() => import('@/components/MkUrlPreviewPopup.vue')), {
		showing,
		url: props.url,
		source: el.value,
	}, {}, 'closed');
});

const schema = url.protocol;
const hostname = decodePunycode(url.hostname);
const port = url.port;
const pathname = safeURIDecode(url.pathname);
const query = safeURIDecode(url.search);
const hash = safeURIDecode(url.hash);
const attr = self ? 'to' : 'href';
const target = self ? null : '_blank';
</script>

<style lang="scss" scoped>
.ieqqeuvs {
	word-break: break-all;

	> .icon {
		padding-left: 2px;
		font-size: .9em;
	}

	> .self {
		font-weight: bold;
	}

	> .schema {
		opacity: 0.5;
	}

	> .hostname {
		font-weight: bold;
	}

	> .pathname {
		opacity: 0.8;
	}

	> .query {
		opacity: 0.5;
	}

	> .hash {
		font-style: italic;
	}
}
</style>
