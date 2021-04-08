<template>
<div class="mrajymqm _narrow_" v-if="component">
	<header class="header" @contextmenu.prevent.stop="onContextmenu">
		<button class="_button" @click="back()" v-if="history.length > 0"><Fa :icon="faChevronLeft"/></button>
		<XHeader class="title" :info="pageInfo" :with-back="false" :center="false"/>
		<button class="_button" @click="close()"><Fa :icon="faTimes"/></button>
	</header>
	<component :is="component" v-bind="props" :ref="changePage"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faChevronLeft, faExpandAlt, faWindowMaximize, faExternalLinkAlt, faLink } from '@fortawesome/free-solid-svg-icons';
import XHeader from '../_common_/header.vue';
import * as os from '@client/os';
import copyToClipboard from '@client/scripts/copy-to-clipboard';
import { resolve } from '@client/router';
import { url } from '@client/config';

export default defineComponent({
	components: {
		XHeader
	},

	provide() {
		return {
			navHook: (path) => {
				this.navigate(path);
			}
		};
	},

	data() {
		return {
			path: null,
			component: null,
			props: {},
			pageInfo: null,
			history: [],
			faTimes, faChevronLeft,
		};
	},

	computed: {
		url(): string {
			return url + this.path;
		}
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		navigate(path, record = true) {
			if (record && this.path) this.history.push(this.path);
			this.path = path;
			const { component, props } = resolve(path);
			this.component = component;
			this.props = props;
			this.$emit('open');
		},

		back() {
			this.navigate(this.history.pop(), false);
		},

		close() {
			this.path = null;
			this.component = null;
			this.props = {};
			this.$emit('close');
		},

		onContextmenu(e) {
			os.contextMenu([{
				type: 'label',
				text: this.path,
			}, {
				icon: faExpandAlt,
				text: this.$ts.showInPage,
				action: () => {
					this.$router.push(this.path);
					this.close();
				}
			}, {
				icon: faWindowMaximize,
				text: this.$ts.openInWindow,
				action: () => {
					os.pageWindow(this.path);
					this.close();
				}
			}, null, {
				icon: faExternalLinkAlt,
				text: this.$ts.openInNewTab,
				action: () => {
					window.open(this.url, '_blank');
					this.close();
				}
			}, {
				icon: faLink,
				text: this.$ts.copyLink,
				action: () => {
					copyToClipboard(this.url);
				}
			}], e);
		}
	}
});
</script>

<style lang="scss" scoped>
.mrajymqm {
	$header-height: 54px; // TODO: どこかに集約したい

	--root-margin: 16px;
	--margin: var(--marginHalf);

	height: 100%;
	overflow: auto;
	box-sizing: border-box;

	> .header {
		display: flex;
		position: sticky;
		z-index: 1000;
		top: 0;
		height: $header-height;
		width: 100%;
		line-height: $header-height;
		font-weight: bold;
		//background-color: var(--panel);
		-webkit-backdrop-filter: blur(32px);
		backdrop-filter: blur(32px);
		background-color: var(--header);
		border-bottom: solid 0.5px var(--divider);
		box-sizing: border-box;

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
</style>

