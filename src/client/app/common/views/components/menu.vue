<template>
<div class="mk-menu">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ hukidasi }" ref="popover">
		<template v-for="item in items">
			<div v-if="item === null"></div>
			<button v-if="item" @click="clicked(item.onClick)" v-html="item.content"></button>
		</template>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	props: ['source', 'compact', 'items'],
	data() {
		return {
			hukidasi: !this.compact
		};
	},
	mounted() {
		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (this.compact) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				left = (x - (width / 2));
				top = (y - (height / 2));
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				left = (x - (width / 2));
				top = y;
			}

			if (left + width > window.innerWidth) {
				left = window.innerWidth - width;
				this.hukidasi = false;
			}

			if (top + height > window.innerHeight) {
				top = window.innerHeight - height;
				this.hukidasi = false;
			}

			popover.style.left = left + 'px';
			popover.style.top = top + 'px';

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
		clicked(fn) {
			fn();
			this.close();
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
				complete: () => {
					this.$emit('closed');
					this.$destroy();
				}
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

$border-color = rgba(27, 31, 35, 0.15)

.mk-menu
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background rgba(#000, 0.1)
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

		&.hukidasi
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
			display block
			padding 8px 16px
			width 100%

			&:hover
				color $theme-color-foreground
				background $theme-color
				text-decoration none

			&:active
				color $theme-color-foreground
				background darken($theme-color, 10%)

		> div
			margin 8px 0
			height 1px
			background #eee

</style>
