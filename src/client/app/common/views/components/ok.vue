<template>
<div class="yvbkymdqeusiqucuuloahhiqflzinufs">
	<div class="bg" ref="bg"></div>
	<div class="body" ref="body">
		<div class="icon">
			<div class="circle left"></div>
			<span class="check tip"></span>
			<span class="check long"></span>
			<div class="ring"></div>
			<div class="fix"></div>
			<div class="circle right"></div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	mounted() {
		this.$nextTick(() => {
			anime({
				targets: this.$refs.bg,
				opacity: 1,
				duration: 300,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.body,
				opacity: 1,
				scale: [1.2, 1],
				duration: 300,
				easing: [0, 0.5, 0.5, 1]
			});
		});

		setTimeout(() => {
			anime({
				targets: this.$refs.bg,
				opacity: 0,
				duration: 300,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.body,
				opacity: 0,
				scale: 0.8,
				duration: 300,
				easing: [0.5, 0, 1, 0.5],
				complete: () => this.destroyDom()
			});
		}, 1250);
	}
});
</script>

<style lang="stylus" scoped>
.yvbkymdqeusiqucuuloahhiqflzinufs
	pointer-events none

	> .bg
		display block
		position fixed
		z-index 10000
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)
		opacity 0

	> .body
		position fixed
		z-index 10000
		top 0
		right 0
		left 0
		bottom 0
		margin auto
		width 150px
		height 150px
		background var(--face)
		border-radius 8px
		opacity 0

		> .icon
			display flex
			justify-content center
			position absolute
			top 0
			right 0
			left 0
			bottom 0
			width 5em
			height 5em
			margin auto
			border .25em solid transparent
			border-radius 50%
			line-height 5em
			cursor default
			box-sizing content-box
			user-select none
			zoom normal
			border-color #a5dc86

			> .circle
				position absolute
				width 3.75em
				height 7.5em
				transform rotate(45deg)
				border-radius 50%
				background var(--face)

				&.left
					top -.4375em
					left -2.0635em
					transform rotate(-45deg)
					transform-origin 3.75em 3.75em
					border-radius 7.5em 0 0 7.5em

				&.right
					top -.6875em
					left 1.875em
					transform rotate(-45deg)
					transform-origin 0 3.75em
					border-radius 0 7.5em 7.5em 0
					animation swal2-rotate-success-circular-line 4.25s ease-in

			> .check
				display block
				position absolute
				height .3125em
				border-radius .125em
				background-color #a5dc86
				z-index 2

				&.tip
					top 2.875em
					left .875em
					width 1.5625em
					transform rotate(45deg)
					animation swal2-animate-success-line-tip .75s

				&.long
					top 2.375em
					right .5em
					width 2.9375em
					transform rotate(-45deg)
					animation swal2-animate-success-line-long .75s

			> .fix
				position absolute
				top .5em
				left 1.625em
				width .4375em
				height 5.625em
				transform rotate(-45deg)
				z-index 1
				background var(--face)

			> .ring
				position absolute
				top -.25em
				left -.25em
				width 100%
				height 100%
				border .25em solid rgba(165,220,134,.3)
				border-radius 50%
				z-index 2
				box-sizing content-box
</style>
