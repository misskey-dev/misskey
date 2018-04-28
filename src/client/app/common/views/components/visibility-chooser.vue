<template>
<div class="mk-visibility-chooser">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ compact }" ref="popover">
		<div @click="choose('public')" :class="{ active: v == 'public' }">
			<div>%fa:globe%</div>
			<div>
				<span>公開</span>
			</div>
		</div>
		<div @click="choose('home')" :class="{ active: v == 'home' }">
			<div>%fa:home%</div>
			<div>
				<span>ホーム</span>
				<span>ホームタイムラインにのみ公開</span>
			</div>
		</div>
		<div @click="choose('followers')" :class="{ active: v == 'followers' }">
			<div>%fa:unlock%</div>
			<div>
				<span>フォロワー</span>
				<span>自分のフォロワーにのみ公開</span>
			</div>
		</div>
		<div @click="choose('mentioned')" :class="{ active: v == 'mentioned' }">
			<div>%fa:envelope%</div>
			<div>
				<span>メンション</span>
				<span>言及したユーザーにのみ公開</span>
			</div>
		</div>
		<div @click="choose('private')" :class="{ active: v == 'private' }">
			<div>%fa:lock%</div>
			<div>
				<span>非公開</span>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	props: ['source', 'compact', 'v'],
	mounted() {
		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			if (this.compact) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				popover.style.left = (x - (width / 2)) + 'px';
				popover.style.top = (y - (height / 2)) + 'px';
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				popover.style.left = (x - (width / 2)) + 'px';
				popover.style.top = y + 'px';
			}

			anime({
				targets: this.$refs.backdrop,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: 500
			});
		});
	},
	methods: {
		choose(visibility) {
			this.$emit('chosen', visibility);
			this.$destroy();
		},
		close() {
			(this.$refs.backdrop as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: 200,
				easing: 'linear'
			});

			(this.$refs.popover as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: 200,
				easing: 'easeInBack',
				complete: () => this.$destroy()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

$border-color = rgba(27, 31, 35, 0.15)

root(isDark)
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background isDark ? rgba(#000, 0.4) : rgba(#000, 0.1)
		opacity 0

	> .popover
		$bgcolor = isDark ? #2c303c : #fff
		position absolute
		z-index 10001
		width 240px
		padding 8px 0
		background $bgcolor
		border 1px solid $border-color
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		$balloon-size = 10px

		&:not(.compact)
			margin-top $balloon-size
			transform-origin center -($balloon-size)

			&:before
				content ""
				display block
				position absolute
				top -($balloon-size * 2)
				left s('calc(50% - %s)', $balloon-size)
				border-top solid $balloon-size transparent
				border-left solid $balloon-size transparent
				border-right solid $balloon-size transparent
				border-bottom solid $balloon-size $border-color

			&:after
				content ""
				display block
				position absolute
				top -($balloon-size * 2) + 1.5px
				left s('calc(50% - %s)', $balloon-size)
				border-top solid $balloon-size transparent
				border-left solid $balloon-size transparent
				border-right solid $balloon-size transparent
				border-bottom solid $balloon-size $bgcolor

		> div
			display flex
			padding 8px 14px
			font-size 12px
			color isDark ? #fff : #666
			cursor pointer

			&:hover
				background isDark ? #252731 : #eee

			&:active
				background isDark ? #21242b : #ddd

			&.active
				color $theme-color-foreground
				background $theme-color

			> *
				user-select none
				pointer-events none

			> *:first-child
				display flex
				justify-content center
				align-items center
				margin-right 10px

			> *:last-child
				flex 1 1 auto

				> span:first-child
					display block
					font-weight bold

				> span:last-child:not(:first-child)
					opacity 0.6

.mk-visibility-chooser[data-darkmode]
	root(true)

.mk-visibility-chooser:not([data-darkmode])
	root(false)

</style>
