<template>
<svg class="mbcofsoe" viewBox="0 0 10 10" preserveAspectRatio="none">
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

	<line
		:x1="5 - (Math.sin(sAngle) * (sHandLengthRatio * handsTailLength))"
		:y1="5 + (Math.cos(sAngle) * (sHandLengthRatio * handsTailLength))"
		:x2="5 + (Math.sin(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:y2="5 - (Math.cos(sAngle) * ((sHandLengthRatio * 5) - handsPadding))"
		:stroke="sHandColor"
		:stroke-width="thickness / 2"
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
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import tinycolor from 'tinycolor2';
import { globalEvents } from '@/events.js';

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
}>(), {
	numbers: false,
	thickness: 0.1,
	offset: 0 - new Date().getTimezoneOffset(),
	twentyfour: false,
	graduations: 'dots',
	fadeGraduations: true,
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

const now = shallowRef(new Date());
now.value.setMinutes(now.value.getMinutes() + (new Date().getTimezoneOffset() + props.offset));

const enabled = ref(true);
const majorGraduationColor = ref<string>();
const minorGraduationColor = ref<string>();
const sHandColor = ref<string>();
const mHandColor = ref<string>();
const hHandColor = ref<string>();
const nowColor = ref<string>();
const s = computed(() => now.value.getSeconds());
const m = computed(() => now.value.getMinutes());
const h = computed(() => now.value.getHours());
const hAngle = computed(() => Math.PI * (h.value % (props.twentyfour ? 24 : 12) + (m.value + s.value / 60) / 60) / (props.twentyfour ? 12 : 6));
const mAngle = computed(() => Math.PI * (m.value + s.value / 60) / 30);
const sAngle = computed(() => Math.PI * s.value / 30);

function tick() {
	const date = new Date();
	date.setMinutes(now.value.getMinutes() + (new Date().getTimezoneOffset() + props.offset));
	now.value = date;
}

function calcColors() {
	const computedStyle = getComputedStyle(document.documentElement);
	const dark = tinycolor(computedStyle.getPropertyValue('--bg')).isDark();
	const accent = tinycolor(computedStyle.getPropertyValue('--accent')).toHexString();
	majorGraduationColor.value = dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
	minorGraduationColor.value = dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
	sHandColor.value = dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)';
	mHandColor.value = tinycolor(computedStyle.getPropertyValue('--fg')).toHexString();
	hHandColor.value = accent;
	nowColor.value = accent;
}

calcColors();

onMounted(() => {
	const update = () => {
		if (enabled.value) {
			tick();
			window.setTimeout(update, 1000);
		}
	};
	update();

	globalEvents.on('themeChanged', calcColors);
});

onBeforeUnmount(() => {
	enabled.value = false;

	globalEvents.off('themeChanged', calcColors);
});
</script>

<style lang="scss" scoped>
.mbcofsoe {
	display: block;
}
</style>
