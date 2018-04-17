<template>
<div class="mk-note-menu">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ compact }" ref="popover">
		<button v-if="note.userId == os.i.id" @click="pin">%i18n:@pin%</button>
		<a v-if="note.uri" :href="note.uri" target="_blank">%i18n:@remote%</a>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	props: ['note', 'source', 'compact'],
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
		pin() {
			(this as any).api('i/pin', {
				noteId: this.note.id
			}).then(() => {
				this.$destroy();
			});
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

.mk-note-menu
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background rgba(0, 0, 0, 0.1)
		opacity 0

	> .popover
		position absolute
		z-index 10001
		padding 8px 0
		background #fff
		border 1px solid $border-color
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		$balloon-size = 16px

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
				border-bottom solid $balloon-size #fff

		> button
		> a
			display block
			padding 8px 16px

			&:hover
				color $theme-color-foreground
				background $theme-color
				text-decoration none

			&:active
				color $theme-color-foreground
				background darken($theme-color, 10%)

</style>
