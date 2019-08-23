<template>
<component class="dmtdnykelhudezerjlfpbhgovrgnqqgr"
	:is="link ? 'a' : 'button'"
	:class="{ inline, primary, wait, round: $store.state.device.roundedCorners }"
	:type="type"
	@click="$emit('click')"
	@mousedown="onMousedown"
>
	<div ref="ripples" class="ripples"></div>
	<div class="content">
		<slot></slot>
	</div>
</component>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	inject: {
		horizonGrouped: {
			default: false
		}
	},
	props: {
		type: {
			type: String,
			required: false
		},
		primary: {
			type: Boolean,
			required: false,
			default: false
		},
		inline: {
			type: Boolean,
			required: false,
			default(): boolean {
				return this.horizonGrouped;
			}
		},
		link: {
			type: Boolean,
			required: false,
			default: false
		},
		autofocus: {
			type: Boolean,
			required: false,
			default: false
		},
		wait: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	mounted() {
		if (this.autofocus) {
			this.$nextTick(() => {
				this.$el.focus();
			});
		}
	},
	methods: {
		onMousedown(e: MouseEvent) {
			function distance(p, q) {
				return Math.hypot(p.x - q.x, p.y - q.y);
			}

			function calcCircleScale(boxW, boxH, circleCenterX, circleCenterY) {
				const origin = {x: circleCenterX, y: circleCenterY};
				const dist1 = distance({x: 0, y: 0}, origin);
				const dist2 = distance({x: boxW, y: 0}, origin);
				const dist3 = distance({x: 0, y: boxH}, origin);
				const dist4 = distance({x: boxW, y: boxH }, origin);
				return Math.max(dist1, dist2, dist3, dist4) * 2;
			}

			const rect = e.target.getBoundingClientRect();

			const ripple = document.createElement('div');
			ripple.style.top = (e.clientY - rect.top - 1).toString() + 'px';
			ripple.style.left = (e.clientX - rect.left - 1).toString() + 'px';

			this.$refs.ripples.appendChild(ripple);

			const circleCenterX = e.clientX - rect.left;
			const circleCenterY = e.clientY - rect.top;

			const scale = calcCircleScale(e.target.clientWidth, e.target.clientHeight, circleCenterX, circleCenterY);

			setTimeout(() => {
				ripple.style.transform = 'scale(' + (scale / 2) + ')';
			}, 1);
			setTimeout(() => {
				ripple.style.transition = 'all 1s ease';
				ripple.style.opacity = '0';
			}, 1000);
			setTimeout(() => {
				if (this.$refs.ripples) this.$refs.ripples.removeChild(ripple);
			}, 2000);
		}
	}
});
</script>

<style lang="stylus" scoped>
.dmtdnykelhudezerjlfpbhgovrgnqqgr
	display block
	width 100%
	margin 0
	padding 8px 10px
	text-align center
	font-weight normal
	font-size 14px
	line-height 24px
	border none
	outline none
	box-shadow none
	text-decoration none
	user-select none
	color var(--text)
	background var(--buttonBg)

	&.round
		border-radius 6px

	&:not(:disabled):hover
		background var(--buttonHoverBg)

	&:not(:disabled):active
		background var(--buttonActiveBg)

	&.primary
		color var(--primaryForeground)
		background var(--primary)

		&:not(:disabled):hover
			background var(--primaryLighten5)

		&:not(:disabled):active
			background var(--primaryDarken5)

	*
		pointer-events none
		user-select none

	&:disabled
		opacity 0.7

	&:focus
		&:after
			content ""
			pointer-events none
			position absolute
			top -5px
			right -5px
			bottom -5px
			left -5px
			border 2px solid var(--primaryAlpha03)

	&.round:focus:after
		border-radius 10px

	&:not(.inline) + .dmtdnykelhudezerjlfpbhgovrgnqqgr
		margin-top 16px

	&.inline
		display inline-block
		width auto
		min-width 100px

	&.primary
		font-weight bold

	&.wait
		background linear-gradient(
			45deg,
			var(--primaryDarken10) 25%,
			var(--primary)              25%,
			var(--primary)              50%,
			var(--primaryDarken10) 50%,
			var(--primaryDarken10) 75%,
			var(--primary)              75%,
			var(--primary)
		)
		background-size 32px 32px
		animation stripe-bg 1.5s linear infinite
		opacity 0.7
		cursor wait

		@keyframes stripe-bg
			from {background-position: 0 0;}
			to   {background-position: -64px 32px;}

	> .ripples
		position absolute
		z-index 0
		top 0
		left 0
		width 100%
		height 100%
		overflow hidden

		>>> div
			position absolute
			width 2px
			height 2px
			border-radius 100%
			background rgba(0, 0, 0, 0.1)
			opacity 1
			transform scale(1)
			transition all 0.5s cubic-bezier(0, .5, .5, 1)

	&.round > .ripples
		border-radius 6px

	&.primary > .ripples >>> div
		background rgba(0, 0, 0, 0.15)

	> .content
		z-index 1

</style>
