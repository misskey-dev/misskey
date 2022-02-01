<template>
<transition :name="$store.state.animation ? 'tooltip' : ''" appear @after-leave="emit('closed')">
	<div v-show="showing" ref="el" class="buebdbiu _acrylic _shadow" :style="{ zIndex, maxWidth: maxWidth + 'px' }">
		<slot>{{ text }}</slot>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as os from '@/os';

const props = withDefaults(defineProps<{
	showing: boolean;
	targetElement?: HTMLElement;
	x?: number;
	y?: number;
	text?: string;
	maxWidth?: number;
}>(), {
	maxWidth: 250,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const el = ref<HTMLElement>();
const zIndex = os.claimZIndex('high');

const setPosition = () => {
	if (el.value == null) return;

	const contentWidth = el.value.offsetWidth;
	const contentHeight = el.value.offsetHeight;

	let left: number;
	let top: number;

	let rect: DOMRect;

	if (props.targetElement) {
		rect = props.targetElement.getBoundingClientRect();

		left = rect.left + window.pageXOffset + (props.targetElement.offsetWidth / 2);
		top = rect.top + window.pageYOffset - contentHeight;

		el.value.style.transformOrigin = 'center bottom';
	} else {
		left = props.x;
		top = props.y - contentHeight;
	}

	left -= (el.value.offsetWidth / 2);

	if (left + contentWidth - window.pageXOffset > window.innerWidth) {
		left = window.innerWidth - contentWidth + window.pageXOffset - 1;
	}

	// ツールチップを上に向かって表示するスペースがなければ下に向かって出す
	if (top - window.pageYOffset < 0) {
		if (props.targetElement) {
			top = rect.top + window.pageYOffset + props.targetElement.offsetHeight;
			el.value.style.transformOrigin = 'center top';
		} else {
			top = props.y;
		}
	}

	el.value.style.left = left + 'px';
	el.value.style.top = top + 'px';
};

onMounted(() => {
	nextTick(() => {
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
	font-size: 0.8em;
	padding: 8px 12px;
	box-sizing: border-box;
	text-align: center;
	border-radius: 4px;
	border: solid 0.5px var(--divider);
	pointer-events: none;
	transform-origin: center center;
}
</style>
