<template>
<Transition
	:enter-active-class="$store.state.animation ? $style.transition_tooltip_enterActive : ''"
	:leave-active-class="$store.state.animation ? $style.transition_tooltip_leaveActive : ''"
	:enter-from-class="$store.state.animation ? $style.transition_tooltip_enterFrom : ''"
	:leave-to-class="$store.state.animation ? $style.transition_tooltip_leaveTo : ''"
	appear @after-leave="emit('closed')"
>
	<div v-show="showing" ref="el" :class="$style.root" class="_acrylic _shadow" :style="{ zIndex, maxWidth: maxWidth + 'px' }">
		<slot>
			<Mfm v-if="asMfm" :text="text"/>
			<span v-else>{{ text }}</span>
		</slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, shallowRef } from 'vue';
import * as os from '@/os';
import { calcPopupPosition } from '@/scripts/popup-position';

const props = withDefaults(defineProps<{
	showing: boolean;
	targetElement?: HTMLElement;
	x?: number;
	y?: number;
	text?: string;
	asMfm?: boolean;
	maxWidth?: number;
	direction?: 'top' | 'bottom' | 'right' | 'left';
	innerMargin?: number;
}>(), {
	maxWidth: 250,
	direction: 'top',
	innerMargin: 0,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const el = shallowRef<HTMLElement>();
const zIndex = os.claimZIndex('high');

function setPosition() {
	const data = calcPopupPosition(el.value, {
		anchorElement: props.targetElement,
		direction: props.direction,
		align: 'center',
		innerMargin: props.innerMargin,
		x: props.x,
		y: props.y,
	});

	el.value.style.transformOrigin = data.transformOrigin;
	el.value.style.left = data.left + 'px';
	el.value.style.top = data.top + 'px';
}

let loopHandler;

onMounted(() => {
	nextTick(() => {
		setPosition();

		const loop = () => {
			loopHandler = window.requestAnimationFrame(() => {
				setPosition();
				loop();
			});
		};

		loop();
	});
});

onUnmounted(() => {
	window.cancelAnimationFrame(loopHandler);
});
</script>

<style lang="scss" module>
.transition_tooltip_enterActive,
.transition_tooltip_leaveActive {
	opacity: 1;
	transform: scale(1);
	transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_tooltip_enterFrom,
.transition_tooltip_leaveTo {
	opacity: 0;
	transform: scale(0.75);
}

.root {
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
