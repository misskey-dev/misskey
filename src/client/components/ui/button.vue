<template>
<component class="bghgjjyj _button"
	:is="link ? 'a' : 'button'"
	:class="{ inline, primary }"
	:type="type"
	@click="$emit('click', $event)"
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
			default: false
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

<style lang="scss" scoped>
.bghgjjyj {
	position: relative;
	display: block;
	min-width: 100px;
	padding: 8px 14px;
	text-align: center;
	font-weight: normal;
	font-size: 0.9em;
	line-height: 24px;
	box-shadow: none;
	text-decoration: none;
	background: var(--buttonBg);
	border-radius: 6px;
	overflow: hidden;

	&:not(:disabled):hover {
		background: var(--buttonHoverBg);
	}

	&:not(:disabled):active {
		background: var(--buttonHoverBg);
	}

	&.primary {
		color: #fff;
		background: var(--accent);

		&:not(:disabled):hover {
			background: var(--jkhztclx);
		}

		&:not(:disabled):active {
			background: var(--jkhztclx);
		}
	}

	&:disabled {
		opacity: 0.7;
	}

	&:focus {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -5px;
			right: -5px;
			bottom: -5px;
			left: -5px;
			border: 2px solid var(--accentAlpha03);
			border-radius: 10px;
		}
	}

	&.inline + .bghgjjyj {
		margin-left: 12px;
	}

	&:not(.inline) + .bghgjjyj {
		margin-top: 16px;
	}

	&.inline {
		display: inline-block;
		width: auto;
		min-width: 100px;
	}

	&.primary {
		font-weight: bold;
	}

	> .ripples {
		position: absolute;
		z-index: 0;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 6px;
		overflow: hidden;

		::v-deep div {
			position: absolute;
			width: 2px;
			height: 2px;
			border-radius: 100%;
			background: rgba(0, 0, 0, 0.1);
			opacity: 1;
			transform: scale(1);
			transition: all 0.5s cubic-bezier(0,.5,0,1);
		}
	}

	&.primary > .ripples ::v-deep div {
		background: rgba(0, 0, 0, 0.15);
	}

	> .content {
		position: relative;
		z-index: 1;
	}
}
</style>
