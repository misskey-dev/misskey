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

const el = ref<HTMLElement>();
const zIndex = os.claimZIndex('high');

const setPosition = () => {
	if (el.value == null) return;

	const contentWidth = el.value.offsetWidth;
	const contentHeight = el.value.offsetHeight;

	let rect: DOMRect;

	if (props.targetElement) {
		rect = props.targetElement.getBoundingClientRect();
	}

	const calcPosWhenTop = () => {
		let left: number;
		let top: number;

		if (props.targetElement) {
			left = rect.left + window.pageXOffset + (props.targetElement.offsetWidth / 2);
			top = (rect.top + window.pageYOffset - contentHeight) - props.innerMargin;
		} else {
			left = props.x;
			top = (props.y - contentHeight) - props.innerMargin;
		}

		left -= (el.value.offsetWidth / 2);

		if (left + contentWidth - window.pageXOffset > window.innerWidth) {
			left = window.innerWidth - contentWidth + window.pageXOffset - 1;
		}

		return [left, top];
	};

	const calcPosWhenBottom = () => {
		let left: number;
		let top: number;

		if (props.targetElement) {
			left = rect.left + window.pageXOffset + (props.targetElement.offsetWidth / 2);
			top = (rect.top + window.pageYOffset + props.targetElement.offsetHeight) + props.innerMargin;
		} else {
			left = props.x;
			top = (props.y) + props.innerMargin;
		}

		left -= (el.value.offsetWidth / 2);

		if (left + contentWidth - window.pageXOffset > window.innerWidth) {
			left = window.innerWidth - contentWidth + window.pageXOffset - 1;
		}

		return [left, top];
	};

	const calcPosWhenLeft = () => {
		let left: number;
		let top: number;

		if (props.targetElement) {
			left = (rect.left + window.pageXOffset - contentWidth) - props.innerMargin;
			top = rect.top + window.pageYOffset + (props.targetElement.offsetHeight / 2);
		} else {
			left = (props.x - contentWidth) - props.innerMargin;
			top = props.y;
		}

		top -= (el.value.offsetHeight / 2);

		if (top + contentHeight - window.pageYOffset > window.innerHeight) {
			top = window.innerHeight - contentHeight + window.pageYOffset - 1;
		}

		return [left, top];
	};

	const calcPosWhenRight = () => {
		let left: number;
		let top: number;

		if (props.targetElement) {
			left = (rect.left + window.pageXOffset) + props.innerMargin;
			top = rect.top + window.pageYOffset + (props.targetElement.offsetHeight / 2);
		} else {
			left = props.x + props.innerMargin;
			top = props.y;
		}

		top -= (el.value.offsetHeight / 2);

		if (top + contentHeight - window.pageYOffset > window.innerHeight) {
			top = window.innerHeight - contentHeight + window.pageYOffset - 1;
		}

		return [left, top];
	};

	const calc = (): {
		left: number;
		top: number;
		transformOrigin: string;
	} => {
		switch (props.direction) {
			case 'top': {
				const [left, top] = calcPosWhenTop();

				// ツールチップを上に向かって表示するスペースがなければ下に向かって出す
				if (top - window.pageYOffset < 0) {
					const [left, top] = calcPosWhenBottom();
					return { left, top, transformOrigin: 'center top' };
				}

				return { left, top, transformOrigin: 'center bottom' };
			}

			case 'bottom': {
				const [left, top] = calcPosWhenBottom();
				// TODO: ツールチップを下に向かって表示するスペースがなければ上に向かって出す
				return { left, top, transformOrigin: 'center top' };
			}

			case 'left': {
				const [left, top] = calcPosWhenLeft();

				// ツールチップを左に向かって表示するスペースがなければ右に向かって出す
				if (left - window.pageXOffset < 0) {
					const [left, top] = calcPosWhenRight();
					return { left, top, transformOrigin: 'left center' };
				}

				return { left, top, transformOrigin: 'right center' };
			}

			case 'right': {
				const [left, top] = calcPosWhenRight();
				// TODO: ツールチップを右に向かって表示するスペースがなければ左に向かって出す
				return { left, top, transformOrigin: 'left center' };
			}
		}

		return null as never;
	};

	const { left, top, transformOrigin } = calc();
	el.value.style.transformOrigin = transformOrigin;
	el.value.style.left = left + 'px';
	el.value.style.top = top + 'px';
};

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
