<template>
<mk-ui>
	<span slot="header" @click="showNav = true">
		<span>
			<span v-if="src == 'home'">%fa:home%ホーム</span>
			<span v-if="src == 'local'">%fa:R comments%ローカル</span>
			<span v-if="src == 'global'">%fa:globe%グローバル</span>
			<span v-if="src == 'list'">%fa:list%{{ list.title }}</span>
		</span>
		<span style="margin-left:8px">
			<template v-if="!showNav">%fa:angle-down%</template>
			<template v-else>%fa:angle-up%</template>
		</span>
	</span>

	<template slot="func">
		<button @click="fn">%fa:pencil-alt%</button>
	</template>

	<main>
		<div class="nav" v-if="showNav">
			<div class="bg" @click="showNav = false"></div>
			<div class="body">
				<span :data-is-active="src == 'home'" @click="src = 'home'">%fa:home% ホーム</span>
				<span :data-is-active="src == 'local'" @click="src = 'local'">%fa:R comments% ローカル</span>
				<span :data-is-active="src == 'global'" @click="src = 'global'">%fa:globe% グローバル</span>
			</div>
		</div>

		<div class="tl">
			<x-tl v-if="src == 'home'" ref="tl" key="home" src="home" @loaded="onLoaded"/>
			<x-tl v-if="src == 'local'" ref="tl" key="local" src="local"/>
			<x-tl v-if="src == 'global'" ref="tl" key="global" src="global"/>
			<mk-user-list-timeline v-if="src == 'list'" ref="tl" key="list" :list="list"/>
		</div>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import XTl from './home.timeline.vue';

export default Vue.extend({
	components: {
		XTl
	},

	data() {
		return {
			src: 'home',
			list: null,
			showNav: false
		};
	},

	mounted() {
		document.title = 'Misskey';
		document.documentElement.style.background = '#313a42';

		Progress.start();
	},

	methods: {
		fn() {
			(this as any).apis.post();
		},

		onLoaded() {
			Progress.done();
		},

		warp() {

		}
	}
});
</script>

<style lang="stylus" scoped>
main
	> .nav
		> .bg
			position fixed
			z-index 10000
			top 0
			left 0
			width 100%
			height 100%
			background rgba(#000, 0.5)

		> .body
			position fixed
			z-index 10001
			top 48px
			left 0
			background #fff
			border-radius 8px

	> .tl
		max-width 600px
		margin 0 auto
		padding 8px

		@media (min-width 500px)
			padding 16px

</style>
