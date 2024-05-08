<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<script lang="ts">
import { h, onMounted, onUnmounted, ref, watch } from 'vue';

export default {
	name: 'MarqueeText',
	props: {
		duration: {
			type: Number,
			default: 15,
		},
		repeat: {
			type: Number,
			default: 2,
		},
		paused: {
			type: Boolean,
			default: false,
		},
		reverse: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const contentEl = ref<HTMLElement>();

		function calc() {
			if (contentEl.value == null) return;
			const eachLength = contentEl.value.offsetWidth / props.repeat;
			const factor = 3000;
			const duration = props.duration / ((1 / eachLength) * factor);

			contentEl.value.style.animationDuration = `${duration}s`;
		}

		watch(() => props.duration, calc);

		onMounted(() => {
			calc();
		});

		onUnmounted(() => {
		});

		return {
			contentEl,
		};
	},
	render({
		$slots, $style, $props: {
			duration, repeat, paused, reverse,
		},
	}) {
		return h('div', { class: [$style.wrap] }, [
			h('span', {
				ref: 'contentEl',
				class: [
					paused
						? $style.paused
						: undefined,
					$style.content,
				],
			}, Array(repeat).fill(
				h('span', {
					class: $style.text,
					style: {
						animationDirection: reverse
							? 'reverse'
							: undefined,
					},
				}, $slots.default()),
			)),
		]);
	},
};
</script>

<style lang="scss" module>
.wrap {
	overflow: clip;
	animation-play-state: running;

	&:hover {
		animation-play-state: paused;
	}
}
.content {
	display: inline-block;
	white-space: nowrap;
	animation-play-state: inherit;
}
.text {
	display: inline-block;
	animation-name: marquee;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
	animation-duration: inherit;
	animation-play-state: inherit;
}
.paused .text {
	animation-play-state: paused;
}
@keyframes marquee {
	0% { transform:translateX(0); }
	100% { transform:translateX(-100%); }
}
</style>
