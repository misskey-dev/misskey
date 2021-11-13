<template>
<component :is="self ? 'MkA' : 'a'" class="ieqqeuvs _link" :[attr]="self ? url.substr(local.length) : url" :rel="rel" :target="target"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	@contextmenu.stop="() => {}"
>
	<template v-if="!self">
		<span class="schema">{{ schema }}//</span>
		<span class="hostname">{{ hostname }}</span>
		<span class="port" v-if="port != ''">:{{ port }}</span>
	</template>
	<template v-if="pathname === '/' && self">
		<span class="self">{{ hostname }}</span>
	</template>
	<span class="pathname" v-if="pathname != ''">{{ self ? pathname.substr(1) : pathname }}</span>
	<span class="query">{{ query }}</span>
	<span class="hash">{{ hash }}</span>
	<i v-if="target === '_blank'" class="fas fa-external-link-square-alt icon"></i>
</component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode as decodePunycode } from 'punycode/';
import { url as local } from '@/config';
import { isDeviceTouch } from '@/scripts/is-device-touch';
import * as os from '@/os';

export default defineComponent({
	props: {
		url: {
			type: String,
			required: true,
		},
		rel: {
			type: String,
			required: false,
		}
	},
	data() {
		const self = this.url.startsWith(local);
		return {
			local,
			schema: null as string | null,
			hostname: null as string | null,
			port: null as string | null,
			pathname: null as string | null,
			query: null as string | null,
			hash: null as string | null,
			self: self,
			attr: self ? 'to' : 'href',
			target: self ? null : '_blank',
			showTimer: null,
			hideTimer: null,
			checkTimer: null,
			close: null,
		};
	},
	created() {
		const url = new URL(this.url);
		this.schema = url.protocol;
		this.hostname = decodePunycode(url.hostname);
		this.port = url.port;
		this.pathname = decodeURIComponent(url.pathname);
		this.query = decodeURIComponent(url.search);
		this.hash = decodeURIComponent(url.hash);
	},
	methods: {
		async showPreview() {
			if (!document.body.contains(this.$el)) return;
			if (this.close) return;

			const { dispose } = await os.popup(import('@/components/url-preview-popup.vue'), {
				url: this.url,
				source: this.$el
			});

			this.close = () => {
				dispose();
			};

			this.checkTimer = setInterval(() => {
				if (!document.body.contains(this.$el)) this.closePreview();
			}, 1000);
		},
		closePreview() {
			if (this.close) {
				clearInterval(this.checkTimer);
				this.close();
				this.close = null;
			}
		},
		onMouseover() {
			if (isDeviceTouch) return;
			clearTimeout(this.showTimer);
			clearTimeout(this.hideTimer);
			this.showTimer = setTimeout(this.showPreview, 500);
		},
		onMouseleave() {
			if (isDeviceTouch) return;
			clearTimeout(this.showTimer);
			clearTimeout(this.hideTimer);
			this.hideTimer = setTimeout(this.closePreview, 500);
		}
	}
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
