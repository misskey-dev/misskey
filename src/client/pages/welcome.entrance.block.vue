<template>
<div class="xyeqzsjl _panel">
	<header>
		<XHeader :info="pageInfo" :with-back="false"/>
		<div class="buttons">
			<button class="_button" @click="back()" v-if="history.length > 0"><Fa :icon="faChevronLeft"/></button>
			<button class="_button" style="pointer-events: none;" v-else><!-- マージンのバランスを取るためのダミー --></button>
		</div>
	</header>
	<div>
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import XHeader from '@/ui/_common_/header.vue';
import { popout } from '@/scripts/popout';
import { resolve } from '@/router';
import { url } from '@/config';

export default defineComponent({
	components: {
		XWindow,
		XHeader,
	},

	provide() {
		return {
			navHook: (path) => {
				this.navigate(path);
			}
		};
	},

	props: {
		initialPath: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			pageInfo: null,
			path: this.initialPath,
			component: null,
			props: null,
			history: [],
			faChevronLeft,
		};
	},

	computed: {
		url(): string {
			return url + this.path;
		},
	},

	created() {
		const { component, props } = resolve(this.initialPath);
		this.component = component;
		this.props = props;
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		navigate(path, record = true) {
			if (record) this.history.push(this.path);
			this.path = path;
			const { component, props } = resolve(path);
			this.component = component;
			this.props = props;
		},

		back() {
			this.navigate(this.history.pop(), false);
		},

		expand() {
			this.$router.push(this.path);
			this.$refs.window.close();
		},

		popout() {
			popout(this.path, this.$el);
			this.$refs.window.close();
		},
	},
});
</script>

<style lang="scss" scoped>
.xyeqzsjl {
	--section-padding: 16px;

	display: flex;
	flex-direction: column;
	contain: content;

	> header {
		position: relative;
		z-index: 1;
		height: 50px;
		line-height: 50px;
		box-shadow: 0px 1px var(--divider);
	}

	> div {
		flex: 1;
		overflow: auto;
	}
}
</style>
