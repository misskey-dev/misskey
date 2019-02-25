<template>
<div class="onchrpzrvnoruiaenfcqvccjfuupzzwv" :class="{ isMobile: $root.isMobile }">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ hukidasi }" ref="popover">
		<template v-for="item, i in items">
			<div v-if="item === null"></div>
			<button v-if="item" @click="clicked(item.action)" :tabindex="i">
				<fa v-if="item.icon" :icon="item.icon"/>{{ item.text }}
			</button>
		</template>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';

export default Vue.extend({
	props: {
		source: {
			required: true
		},
		items: {
			type: Array,
			required: true
		}
	},
	data() {
		return {
			hukidasi: !this.$root.isMobile
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

			if (this.$root.isMobile) {
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

			if (left + width - window.pageXOffset > window.innerWidth) {
				left = window.innerWidth - width + window.pageXOffset;
				this.hukidasi = false;
			}

			if (top + height - window.pageYOffset > window.innerHeight) {
				top = window.innerHeight - height + window.pageYOffset;
				this.hukidasi = false;
			}

			if (top < 0) {
				top = 0;
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
					this.destroyDom();
				}
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.onchrpzrvnoruiaenfcqvccjfuupzzwv
	$bg-color = var(--popupBg)

	position initial

	&.isMobile
		> .popover
			> button
				font-size 15px

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background var(--modalBackdrop)
		opacity 0

	> .popover
		position absolute
		z-index 10001
		padding 8px 0
		background $bg-color
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		$balloon-size = 16px

		&.hukidasi
			margin-top $balloon-size
			transform-origin center -($balloon-size)

			&:before
			&:after
				content ""
				display block
				position absolute
				pointer-events none

			&:before
				top -($balloon-size * 2)
				left s('calc(50% - %s)', $balloon-size)
				border-top solid $balloon-size transparent
				border-left solid $balloon-size transparent
				border-right solid $balloon-size transparent
				border-bottom solid $balloon-size $bg-color

		> button
			display block
			padding 8px 16px
			width 100%
			color var(--popupFg)
			white-space nowrap

			&:hover
				color var(--primaryForeground)
				background var(--primary)
				text-decoration none

			&:active
				color var(--primaryForeground)
				background var(--primaryDarken10)

			> [data-icon]
				margin-right 4px

		> div
			margin 8px 0
			height var(--lineWidth)
			background var(--faceDivider)

</style>
