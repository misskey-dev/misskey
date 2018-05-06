<template>
<div class="mk-timeline">
	<header>
		<span :data-active="src == 'home'" @click="src = 'home'">%fa:home% ホーム</span>
		<span :data-active="src == 'local'" @click="src = 'local'">%fa:R comments% ローカル</span>
		<span :data-active="src == 'global'" @click="src = 'global'">%fa:globe% グローバル</span>
		<span :data-active="src == 'list'" @click="src = 'list'" v-if="list">%fa:list% {{ list.title }}</span>
		<button @click="chooseList" title="リスト">%fa:list%</button>
	</header>
	<x-core v-if="src == 'home'" ref="tl" key="home" src="home"/>
	<x-core v-if="src == 'local'" ref="tl" key="local" src="local"/>
	<x-core v-if="src == 'global'" ref="tl" key="global" src="global"/>
	<mk-user-list-timeline v-if="src == 'list'" ref="tl" :key="list.id" :list="list"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCore from './timeline.core.vue';
import MkUserListsWindow from './user-lists-window.vue';

export default Vue.extend({
	components: {
		XCore
	},

	data() {
		return {
			src: 'home',
			list: null
		};
	},

	created() {
		if ((this as any).os.i.followingCount == 0) {
			this.src = 'local';
		}
	},

	mounted() {
		(this.$refs.tl as any).$once('loaded', () => {
			this.$emit('loaded');
		});
	},

	methods: {
		warp(date) {
			(this.$refs.tl as any).warp(date);
		},

		chooseList() {
			const w = (this as any).os.new(MkUserListsWindow);
			w.$once('choosen', list => {
				this.list = list;
				this.src = 'list';
				w.close();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	background isDark ? #282C37 : #fff
	border solid 1px rgba(#000, 0.075)
	border-radius 6px

	> header
		padding 0 8px
		z-index 10
		background isDark ? #313543 : #fff
		border-radius 6px 6px 0 0
		box-shadow 0 1px isDark ? rgba(#000, 0.15) : rgba(#000, 0.08)

		> button
			position absolute
			z-index 2
			top 0
			right 0
			padding 0
			width 42px
			font-size 0.9em
			line-height 42px
			color isDark ? #9baec8 : #ccc

			&:hover
				color isDark ? #b2c1d5 : #aaa

			&:active
				color isDark ? #b2c1d5 : #999

		> span
			display inline-block
			padding 0 10px
			line-height 42px
			font-size 12px
			user-select none

			&[data-active]
				color $theme-color
				cursor default
				font-weight bold

				&:before
					content ""
					display block
					position absolute
					bottom 0
					left -8px
					width calc(100% + 16px)
					height 2px
					background $theme-color

			&:not([data-active])
				color isDark ? #9aa2a7 : #6f7477
				cursor pointer

				&:hover
					color isDark ? #d9dcde : #525a5f

.mk-timeline[data-darkmode]
	root(true)

.mk-timeline:not([data-darkmode])
	root(false)

</style>
