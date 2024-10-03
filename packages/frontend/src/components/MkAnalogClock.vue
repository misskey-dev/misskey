<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<svg :class="$style.root" viewBox="0 0 10 10" preserveAspectRatio="none">
	<template v-if="props.graduations === 'dots'">
		<circle
			v-for="(angle, i) in graduationsMajor"
			:cx="5 + (Math.sin(angle) * (5 - graduationsPadding))"
			:cy="5 - (Math.cos(angle) * (5 - graduationsPadding))"
			:r="0.125"
			:fill="(props.twentyfour ? h : h % 12) === i ? nowColor : majorGraduationColor"
			:opacity="!props.fadeGraduations || (props.twentyfour ? h : h % 12) === i ? 1 : Math.max(0, 1 - (angleDiff(hAngle, angle) / Math.PI) - numbersOpacityFactor)"
		/>
	</template>
	<template v-else-if="props.graduations === 'numbers'">
		<text
			v-for="(angle, i) in texts"
			:x="5 + (Math.sin(angle) * (5 - textsPadding))"
			:y="5 - (Math.cos(angle) * (5 - textsPadding))"
			text-anchor="middle"
			dominant-baseline="middle"
			:font-size="(props.twentyfour ? h : h % 12) === i ? 1 : 0.7"
			:font-weight="(props.twentyfour ? h : h % 12) === i ? 'bold' : 'normal'"
			:fill="(props.twentyfour ? h : h % 12) === i ? nowColor : 'currentColor'"
			:opacity="!props.fadeGraduations || (props.twentyfour ? h : h % 12) === i ? 1 : Math.max(0, 1 - (angleDiff(hAngle, angle) / Math.PI) - numbersOpacityFactor)"
		>
			{{ i === 0 ? (props.twentyfour ? '24' : '12') : i }}
		</text>
	</template>

	<!--
	<line
		:x1="5 - (Math.sin(sAngle) * (sHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(sAngle) * (sHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:stroke="sHandColor"
		:stroke-width="thickness / 2"
		stroke-linecap="round"
	/>
	-->

	<line
		ref="sLine"
		:class="[$style.s, { [$style.animate]: !disableSAnimate && sAnimation !== 'none', [$style.elastic]: sAnimation === 'elastic', [$style.easeOut]: sAnimation === 'easeOut' }]"
		:x1="5 - (0 * (sHandLengthRatio * handsTailLength))"
		:y1="5 + (1 * (sHandLengthRatio * handsTailLength))"
		:x2="5 + (0 * ((sHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (1 * ((sHandLengthRatio * 5) - handsPadding))"
		:stroke="sHandColor"
		:stroke-width="thickness / 2"
		:style="`transform: rotateZ(${sAngle}rad)`"
		stroke-linecap="round"
	/>

	<line
		:x1="5 - (Math.sin(mAngle) * (mHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(mAngle) * (mHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(mAngle) * ((mHandLengthRatio * 5) - handsPadding))"
		:stroke="mHandColor"
		:stroke-width="thickness"
		stroke-linecap="round"
	/>

	<line
		:x1="5 - (Math.sin(hAngle) * (hHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(hAngle) * (hHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(hAngle) * ((hHandLengthRatio * 5) - handsPadding))"
		:stroke="hHandColor"
		:stroke-width="thickness"
		stroke-linecap="round"
	/>
</svg>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import tinycolor from 'tinycolor2';
import { globalEvents } from '@/events.js';
import { defaultIdlingRenderScheduler } from '@/scripts/idle-render.js';

// https://stackoverflow.com/questions/1878907/how-can-i-find-the-difference-between-two-angles
const angleDiff = (a: number, b: number) => {
	const x = Math.abs(a - b);
	return Math.abs((x + Math.PI) % (Math.PI * 2) - Math.PI);
};

const graduationsPadding = 0.5;
const textsPadding = 0.6;
const handsPadding = 1;
const handsTailLength = 0.7;
const hHandLengthRatio = 0.75;
const mHandLengthRatio = 1;
const sHandLengthRatio = 1;
const numbersOpacityFactor = 0.35;

const props = withDefaults(defineProps<{
	thickness?: number;
	offset?: number;
	twentyfour?: boolean;
	graduations?: 'none' | 'dots' | 'numbers';
	fadeGraduations?: boolean;
	sAnimation?: 'none' | 'elastic' | 'easeOut';
	now?: () => Date;
}>(), {
	numbers: false,
	thickness: 0.1,
	offset: 0 - new Date().getTimezoneOffset(),
	twentyfour: false,
	graduations: 'dots',
	fadeGraduations: true,
	sAnimation: 'elastic',
	now: () => new Date(),
});

const graduationsMajor = computed(() => {
	const angles: number[] = [];
	const times = props.twentyfour ? 24 : 12;
	for (let i = 0; i < times; i++) {
		const angle = Math.PI * i / (times / 2);
		angles.push(angle);
	}
	return angles;
});
const texts = computed(() => {
	const angles: number[] = [];
	const times = props.twentyfour ? 24 : 12;
	for (let i = 0; i < times; i++) {
		const angle = Math.PI * i / (times / 2);
		angles.push(angle);
	}
	return angles;
});

let enabled = true;
const majorGraduationColor = ref<string>();
//let minorGraduationColor = $ref<string>();
const sHandColor = ref<string>();
const mHandColor = ref<string>();
const hHandColor = ref<string>();
const nowColor = ref<string>();
const h = ref<number>(0);
const m = ref<number>(0);
const s = ref<number>(0);
const hAngle = ref<number>(0);
const mAngle = ref<number>(0);
const sAngle = ref<number>(0);
const disableSAnimate = ref(false);
let sOneRound = false;
const sLine = ref<SVGPathElement>();

function tick() {
	const now = props.now();
	now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + props.offset);
	const previousS = s.value;
	const previousM = m.value;
	const previousH = h.value;
	s.value = now.getSeconds();
	m.value = now.getMinutes();
	h.value = now.getHours();
	if (previousS === s.value && previousM === m.value && previousH === h.value) {
		return;
	}
	hAngle.value = Math.PI * (h.value % (props.twentyfour ? 24 : 12) + (m.value + s.value / 60) / 60) / (props.twentyfour ? 12 : 6);
	mAngle.value = Math.PI * (m.value + s.value / 60) / 30;
	if (sOneRound && sLine.value) { // 秒針が一周した際のアニメーションをよしなに処理する(これが無いと秒が59->0になったときに期待したアニメーションにならない)
		sAngle.value = Math.PI * 60 / 30;
		defaultIdlingRenderScheduler.delete(tick);
		sLine.value.addEventListener('transitionend', () => {
			disableSAnimate.value = true;
			requestAnimationFrame(() => {
				sAngle.value = 0;
				requestAnimationFrame(() => {
					disableSAnimate.value = false;
					if (enabled) {
						defaultIdlingRenderScheduler.add(tick);
					}
				});
			});
		}, { once: true });
	} else {
		sAngle.value = Math.PI * s.value / 30;
	}
	sOneRound = s.value === 59;
}

tick();

function calcColors() {
	const computedStyle = getComputedStyle(document.documentElement);
	const dark = tinycolor(computedStyle.getPropertyValue('--bg')).isDark();
	const accent = tinycolor(computedStyle.getPropertyValue('--accent')).toHexString();
	majorGraduationColor.value = dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
	//minorGraduationColor = dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
	sHandColor.value = dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)';
	mHandColor.value = tinycolor(computedStyle.getPropertyValue('--fg')).toHexString();
	hHandColor.value = accent;
	nowColor.value = accent;
}

calcColors();

onMounted(() => {
	defaultIdlingRenderScheduler.add(tick);
	globalEvents.on('themeChanged', calcColors);
});

onBeforeUnmount(() => {
	enabled = false;
	defaultIdlingRenderScheduler.delete(tick);
	globalEvents.off('themeChanged', calcColors);
});
</script>

<style lang="scss" module>
.root {
	display: block;
}

.s {
	will-change: transform;
	transform-origin: 50% 50%;

	&.animate.elastic {
		transition: transform .2s cubic-bezier(.4,2.08,.55,.44);
	}

	&.animate.easeOut {
		transition: transform .7s cubic-bezier(0,.7,.3,1);
	}
}
</style>
