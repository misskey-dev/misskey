<template>
<mk-ui>
	<span slot="header" @click="showNav = true">
		<span>
			<span v-if="src == 'home'">%fa:home%ホーム</span>
			<span v-if="src == 'local'">%fa:R comments%ローカル</span>
			<span v-if="src == 'global'">%fa:globe%グローバル</span>
			<span v-if="src.startsWith('list')">%fa:list%{{ list.title }}</span>
		</span>
		<span style="margin-left:8px">
			<template v-if="!showNav">%fa:angle-down%</template>
			<template v-else>%fa:angle-up%</template>
		</span>
	</span>

	<template slot="func">
		<button @click="fn">%fa:pencil-alt%</button>
	</template>

	<main :data-darkmode="_darkmode_">
		<div class="nav" v-if="showNav">
			<div class="bg" @click="showNav = false"></div>
			<div class="body">
				<div>
					<span :data-active="src == 'home'" @click="src = 'home'">%fa:home% ホーム</span>
					<span :data-active="src == 'local'" @click="src = 'local'">%fa:R comments% ローカル</span>
					<span :data-active="src == 'global'" @click="src = 'global'">%fa:globe% グローバル</span>
					<template v-if="lists">
						<span v-for="l in lists" :data-active="src == 'list:' + l.id" @click="src = 'list:' + l.id; list = l" :key="l.id">%fa:list% {{ l.title }}</span>
					</template>
				</div>
			</div>
		</div>

		<div class="tl">
			<x-tl v-if="src == 'home'" ref="tl" key="home" src="home" @loaded="onLoaded"/>
			<x-tl v-if="src == 'local'" ref="tl" key="local" src="local"/>
			<x-tl v-if="src == 'global'" ref="tl" key="global" src="global"/>
			<mk-user-list-timeline v-if="src.startsWith('list:')" ref="tl" :key="list.id" :list="list"/>
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
			lists: null,
			showNav: false
		};
	},

	watch: {
		src() {
			this.showNav = false;
		},

		showNav(v) {
			if (v && this.lists === null) {
				(this as any).api('users/lists/list').then(lists => {
					this.lists = lists;
				});
			}
		}
	},

	mounted() {
		document.title = 'Misskey';

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
@import '~const.styl'

root(isDark)
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
			top 56px
			left 0
			right 0
			width 300px
			margin 0 auto
			background isDark ? #272f3a : #fff
			border-radius 8px
			box-shadow 0 0 16px rgba(0, 0, 0, 0.1)

			$balloon-size = 16px

			&:after
				content ""
				display block
				position absolute
				top -($balloon-size * 2) + 1.5px
				left s('calc(50% - %s)', $balloon-size)
				border-top solid $balloon-size transparent
				border-left solid $balloon-size transparent
				border-right solid $balloon-size transparent
				border-bottom solid $balloon-size isDark ? #272f3a : #fff

			> div
				padding 8px 0

				> *
					display block
					padding 8px 16px
					color isDark ? #cdd0d8 : #666

					&[data-active]
						color $theme-color-foreground
						background $theme-color

					&:not([data-active]):hover
						background isDark ? #353e4a : #eee

	> .tl
		max-width 680px
		margin 0 auto
		padding 8px

		@media (min-width 500px)
			padding 16px

		@media (min-width 600px)
			padding 32px

main[data-darkmode]
	root(true)

main:not([data-darkmode])
	root(false)

</style>
