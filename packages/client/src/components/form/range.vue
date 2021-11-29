<template>
<div class="timctyfi" :class="{ disabled }">
	<div class="label"><slot name="label"></slot></div>
	<div v-panel class="body">
		<div ref="containerEl" class="container">
			<div class="track">
				<div class="highlight" :style="{ width: (steppedValue * 100) + '%' }"></div>
			</div>
			<div v-if="steps" class="ticks">
				<div v-for="i in (steps + 1)" class="tick" :style="{ left: (((i - 1) / steps) * 100) + '%' }"></div>
			</div>
			<div ref="thumbEl" v-tooltip="textConverter(finalValue)" class="thumb" :style="{ left: thumbPosition + 'px' }" @mousedown="onMousedown" @touchstart="onMousedown"></div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		modelValue: {
			type: Number,
			required: false,
			default: 0
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		min: {
			type: Number,
			required: false,
			default: 0
		},
		max: {
			type: Number,
			required: false,
			default: 100
		},
		step: {
			type: Number,
			required: false,
			default: 1
		},
		autofocus: {
			type: Boolean,
			required: false
		},
		textConverter: {
			type: Function,
			required: false,
			default: (v) => v.toString(),
		},
	},

	setup(props, context) {
		const rawValue = ref((props.modelValue - props.min) / (props.max - props.min));
		const steppedValue = computed(() => {
			if (props.step) {
				const step = props.step / (props.max - props.min);
				return (step * Math.round(rawValue.value / step));
			} else {
				return rawValue.value;
			}
		});
		const finalValue = computed(() => {
			return (steppedValue.value * (props.max - props.min)) + props.min;
		});
		watch(finalValue, () => {
			context.emit('update:modelValue', finalValue.value);
		});

		const thumbWidth = computed(() => {
			if (thumbEl.value == null) return 0;
			return thumbEl.value!.offsetWidth;
		});
		const thumbPosition = computed(() => {
			if (containerEl.value == null) return 0;
			return (containerEl.value.offsetWidth - thumbWidth.value) * steppedValue.value;
		});
		const steps = computed(() => {
			if (props.step) {
				return (props.max - props.min) / props.step;
			} else {
				return 0;
			}
		});
		const containerEl = ref<HTMLElement>();
		const thumbEl = ref<HTMLElement>();

		const onMousedown = (ev: MouseEvent | TouchEvent) => {
			ev.preventDefault();

			const tooltipShowing = ref(true);
			os.popup(import('@/components/ui/tooltip.vue'), {
				showing: tooltipShowing,
				text: computed(() => {
					return props.textConverter(finalValue.value);
				}),
				source: thumbEl,
			}, {}, 'closed');

			const style = document.createElement('style');
			style.appendChild(document.createTextNode('* { cursor: grabbing !important; } body * { pointer-events: none !important; }'));
			document.head.appendChild(style);

			const onDrag = (ev: MouseEvent | TouchEvent) => {
				ev.preventDefault();
				const containerRect = containerEl.value!.getBoundingClientRect();
				const pointerX = ev.touches && ev.touches.length > 0 ? ev.touches[0].clientX : ev.clientX;
				const pointerPositionOnContainer = pointerX - (containerRect.left + (thumbWidth.value / 2));
				rawValue.value = Math.min(1, Math.max(0, pointerPositionOnContainer / (containerEl.value!.offsetWidth - thumbWidth.value)));
			};

			const onMouseup = () => {
				document.head.removeChild(style);
				tooltipShowing.value = false;
				window.removeEventListener('mousemove', onDrag);
				window.removeEventListener('touchmove', onDrag);
				window.removeEventListener('mouseup', onMouseup);
				window.removeEventListener('touchend', onMouseup);
			};

			window.addEventListener('mousemove', onDrag);
			window.addEventListener('touchmove', onDrag);
			window.addEventListener('mouseup', onMouseup, { once: true });
			window.addEventListener('touchend', onMouseup, { once: true });
		};

		return {
			rawValue,
			finalValue,
			steppedValue,
			onMousedown,
			containerEl,
			thumbEl,
			thumbPosition,
			steps,
		};
	},
});
</script>

<style lang="scss" scoped>
@use "sass:math";

.timctyfi {
	position: relative;

	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 0;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .caption {
		font-size: 0.85em;
		padding: 8px 0 0 0;
		color: var(--fgTransparentWeak);

		&:empty {
			display: none;
		}
	}

	$thumbHeight: 20px;
	$thumbWidth: 20px;

	> .body {
		padding: 12px;
		border-radius: 6px;

		> .container {
			position: relative;
			height: $thumbHeight;

			> .track {
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				margin: auto;
				width: calc(100% - #{$thumbWidth});
				height: 3px;
				background: rgba(0, 0, 0, 0.1);
				border-radius: 999px;
				overflow: clip;

				> .highlight {
					position: absolute;
					top: 0;
					left: 0;
					height: 100%;
					background: var(--accent);
					opacity: 0.5;
					transition: width 0.2s cubic-bezier(0,0,0,1);
				}
			}

			> .ticks {
				$tickWidth: 3px;

				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				margin: auto;
				width: calc(100% - #{$thumbWidth});

				> .tick {
					position: absolute;
					bottom: 0;
					width: $tickWidth;
					height: 3px;
					margin-left: - math.div($tickWidth, 2);
					background: var(--divider);
					border-radius: 999px;
				}
			}

			> .thumb {
				position: absolute;
				width: $thumbWidth;
				height: $thumbHeight;
				cursor: grab;
				background: var(--accent);
				border-radius: 999px;
				transition: left 0.2s cubic-bezier(0,0,0,1);

				&:hover {
					background: var(--accentLighten);
				}
			}
		}
	}
}
</style>
