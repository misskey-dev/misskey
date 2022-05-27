<template>
<component :is="self ? 'MkA' : 'a'" ref="el" class="ieqqeuvs _link" :[attr]="self ? url.substr(local.length) : url" :rel="rel" :target="target"
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
	<span v-if="pathname != ''" class="pathname">{{ self ? pathname.substr(1) : pathname }}</span>
	<span class="query">{{ query }}</span>
	<span class="hash">{{ hash }}</span>
	<i v-if="target === '_blank'" class="fas fa-external-link-square-alt icon"></i>
</component>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, ref } from 'vue';
import { toUnicode as decodePunycode } from 'punycode/';
import { url as local } from '@/config';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip';

function safeURIDecode(str: string) {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}

export default defineComponent({
	props: {
		url: {
			type: String,
			required: true,
		},
		rel: {
			type: String,
			required: false,
			default: null,
		}
	},
	setup(props) {
		const self = props.url.startsWith(local);
		const url = new URL(props.url);
		const el = ref();
		
		useTooltip(el, (showing) => {
			os.popup(defineAsyncComponent(() => import('@/components/url-preview-popup.vue')), {
				showing,
				url: props.url,
				source: el.value,
			}, {}, 'closed');
		});

		return {
			local,
			schema: url.protocol,
			hostname: decodePunycode(url.hostname),
			port: url.port,
			pathname: safeURIDecode(url.pathname),
			query: safeURIDecode(url.search),
			hash: safeURIDecode(url.hash),
			self: self,
			attr: self ? 'to' : 'href',
			target: self ? null : '_blank',
			el,
		};
	},
});
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
