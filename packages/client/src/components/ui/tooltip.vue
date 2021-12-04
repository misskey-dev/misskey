<template>
<transition name="tooltip" appear @after-leave="$emit('closed')">
	<div v-show="showing" ref="el" class="buebdbiu _acrylic _shadow" :style="{ maxWidth: maxWidth + 'px' }">
		<slot>{{ text }}</slot>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';

export default defineComponent({
	props: {
		showing: {
			type: Boolean,
			required: true,
		},
		source: {
			required: true,
		},
		text: {
			type: String,
			required: false
		},
		maxWidth: {
			type: Number,
			required: false,
			default: 250,
		},
	},

	emits: ['closed'],

	setup(props, context) {
		const el = ref<HTMLElement>();

		const setPosition = () => {
			if (el.value == null) return;

			const rect = props.source.getBoundingClientRect();

			const contentWidth = el.value.offsetWidth;
			const contentHeight = el.value.offsetHeight;

			let left = rect.left + window.pageXOffset + (props.source.offsetWidth / 2);
			let top = rect.top + window.pageYOffset - contentHeight;

			left -= (el.value.offsetWidth / 2);

			if (left + contentWidth - window.pageXOffset > window.innerWidth) {
				left = window.innerWidth - contentWidth + window.pageXOffset - 1;
			}

			if (top - window.pageYOffset < 0) {
				top = rect.top + window.pageYOffset + props.source.offsetHeight;
				el.value.style.transformOrigin = 'center top';
			}

			el.value.style.left = left + 'px';
			el.value.style.top = top + 'px';
		};

		onMounted(() => {
			nextTick(() => {
				if (props.source == null) {
					context.emit('closed');
					return;
				}

				setPosition();

				let loopHandler;

				const loop = () => {
					loopHandler = window.requestAnimationFrame(() => {
						setPosition();
						loop();
					});
				};

				loop();

				onUnmounted(() => {
					window.cancelAnimationFrame(loopHandler);
				});
			});
		});

		return {
			el,
		};
	},
})
</script>

<style lang="scss" scoped>
.tooltip-enter-active,
.tooltip-leave-active {
	opacity: 1;
	transform: scale(1);
	transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tooltip-enter-from,
.tooltip-leave-active {
	opacity: 0;
	transform: scale(0.75);
}

.buebdbiu {
	position: absolute;
	z-index: 11000;
	font-size: 0.8em;
	padding: 8px 12px;
	box-sizing: border-box;
	text-align: center;
	border-radius: 4px;
	border: solid 0.5px var(--divider);
	pointer-events: none;
	transform-origin: center bottom;
}
</style>
