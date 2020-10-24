<template>
<div class="qvzfzxam" v-if="component">
	<div class="container">
		<header class="header">
			<XHeader :info="pageInfo" :with-back="false"/>
		</header>
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
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
			component: null,
			props: {},
			pageInfo: null,
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
		width: 350px;
		height: 100vh;
		overflow: auto;
		padding-top: $header-height;

		> .header {
			position: fixed;
			z-index: 1000;
			top: 0;
			height: $header-height;
			width: 350px;
			line-height: $header-height;
			text-align: center;
			font-weight: bold;
			//background-color: var(--panel);
			-webkit-backdrop-filter: blur(32px);
			backdrop-filter: blur(32px);
			background-color: var(--header);
			border-bottom: solid 1px var(--divider);
		}
	}
}
</style>

