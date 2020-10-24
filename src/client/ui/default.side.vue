<template>
<div class="qvzfzxam" v-if="component">
	<div class="container">
		<header class="header">
			<button class="_button" @click="back()"><Fa :icon="faChevronLeft"/></button>
			<XHeader class="title" :info="pageInfo" :with-back="false"/>
			<button class="_button" @click="close()"><Fa :icon="faTimes"/></button>
		</header>
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { faTimes, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import XHeader from './_common_/header.vue';

export default defineComponent({
	components: {
		XHeader
	},

	provide() {
		return {
			navHook: (url, component, props) => {
				this.go(url, component, props);
			}
		};
	},

	data() {
		return {
			url: null,
			component: null,
			props: {},
			pageInfo: null,
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

		go(url, component, props) {
			this.url = url;
			this.component = markRaw(component);
			this.props = props;
		},

		close() {
			this.url = null;
			this.component = null;
			this.props = {};
		},
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

