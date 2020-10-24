<template>
<div class="qvzfzxam _narrow_" v-if="component">
	<div class="container">
		<header class="header" @contextmenu.prevent.stop="onContextmenu">
			<button class="_button" @click="back()" v-if="history.length > 0"><Fa :icon="faChevronLeft"/></button>
			<button class="_button" style="pointer-events: none;" v-else><!-- マージンのバランスを取るためのダミー --></button>
			<XHeader class="title" :info="pageInfo" :with-back="false"/>
			<button class="_button" @click="close()"><Fa :icon="faTimes"/></button>
		</header>
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faChevronLeft, faExpandAlt, faWindowMaximize, faExternalLinkAlt, faLink } from '@fortawesome/free-solid-svg-icons';
import XHeader from './_common_/header.vue';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { resolve } from '@/router';

export default defineComponent({
	components: {
		XHeader
	},

	provide() {
		return {
			navHook: (url) => {
				this.navigate(url);
			}
		};
	},

	data() {
		return {
			url: null,
			component: null,
			props: {},
			pageInfo: null,
			history: [],
			faTimes, faChevronLeft,
		};
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		navigate(url, record = true) {
			if (record && this.url) this.history.push(this.url);
			this.url = url;
			const { component, props } = resolve(url);
			this.component = component;
			this.props = props;
		},

		back() {
			this.navigate(this.history.pop(), false);
		},

		close() {
			this.url = null;
			this.component = null;
			this.props = {};
		},

		onContextmenu(e) {
			os.contextMenu([{
				type: 'label',
				text: this.url,
			}, {
				icon: faExpandAlt,
				text: this.$t('showInPage'),
				action: () => {
					this.$router.push(this.url);
					this.close();
				}
			}, {
				icon: faWindowMaximize,
				text: this.$t('openInWindow'),
				action: () => {
					os.pageWindow(this.url);
					this.close();
				}
			}, null, {
				icon: faExternalLinkAlt,
				text: this.$t('openInNewTab'),
				action: () => {
					window.open(this.url, '_blank');
					this.close();
				}
			}, {
				icon: faLink,
				text: this.$t('copyLink'),
				action: () => {
					copyToClipboard(this.url);
				}
			}], e);
		}
	}
});
</script>

<style lang="scss" scoped>
.qvzfzxam {
	$header-height: 60px;

	--section-padding: 16px;
	--margin: var(--marginHalf);

	> .container {
		position: fixed;
		width: 370px;
		height: 100vh;
		overflow: auto;
		padding-top: $header-height;
		box-sizing: border-box;

		> .header {
			display: flex;
			position: fixed;
			z-index: 1000;
			top: 0;
			height: $header-height;
			width: 370px;
			line-height: $header-height;
			text-align: center;
			font-weight: bold;
			//background-color: var(--panel);
			-webkit-backdrop-filter: blur(32px);
			backdrop-filter: blur(32px);
			background-color: var(--header);
			border-bottom: solid 1px var(--divider);

			> ._button {
				height: $header-height;
				width: $header-height;

				&:hover {
					color: var(--fgHighlighted);
				}
			}

			> .title {
				flex: 1;
				position: relative;
			}
		}
	}
}
</style>

