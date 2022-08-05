<template>
<svg class="mbcofsoe" viewBox="0 0 10 10" preserveAspectRatio="none">
	<circle
		v-for="(angle, i) in graduations"
		:key="i"
		:cx="5 + (Math.sin(angle) * (5 - graduationsPadding))"
		:cy="5 - (Math.cos(angle) * (5 - graduationsPadding))"
		:r="i % 5 == 0 ? 0.125 : 0.05"
		:fill="i % 5 == 0 ? majorGraduationColor : minorGraduationColor"
	/>

	<template v-if="props.numbers">
		<text
			v-for="(angle, i) in texts"
			:x="5 + (Math.sin(angle) * (5 - textsPadding))"
			:y="5 - (Math.cos(angle) * (5 - textsPadding))"
			text-anchor="middle"
			dominant-baseline="middle"
			font-family="Verdana"
			font-size="0.75"
			fill="currentColor"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import tinycolor from 'tinycolor2';

const graduationsPadding = 0.5;
const textsPadding = 0.5;
const handsPadding = 1;
const handsTailLength = 0.7;
const hHandLengthRatio = 0.75;
const mHandLengthRatio = 1;
const sHandLengthRatio = 1;
const graduations = (() => {
	const angles: number[] = [];
	for (let i = 0; i < 60; i++) {
		const angle = Math.PI * i / 30;
		angles.push(angle);
	}

	return angles;
})();

const props = withDefaults(defineProps<{
	numbers?: boolean;
	thickness?: number;
	offset?: number;
	twentyfour?: boolean;
}>(), {
	numbers: false,
	thickness: 0.1,
	offset: 0 - new Date().getTimezoneOffset(),
	twentyfour: false,
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

const now = ref(new Date());
now.value.setMinutes(now.value.getMinutes() + (new Date().getTimezoneOffset() + props.offset));

const enabled = ref(true);
const computedStyle = getComputedStyle(document.documentElement);
const dark = computed(() => tinycolor(computedStyle.getPropertyValue('--bg')).isDark());
const majorGraduationColor = computed(() => dark.value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
const minorGraduationColor = computed(() => dark.value ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)');
const sHandColor = computed(() => dark.value ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)');
const mHandColor = computed(() => tinycolor(computedStyle.getPropertyValue('--fg')).toHexString());
const hHandColor = computed(() => tinycolor(computedStyle.getPropertyValue('--accent')).toHexString());
const s = computed(() => now.value.getSeconds());
const m = computed(() => now.value.getMinutes());
const h = computed(() => now.value.getHours());
const hAngle = computed(() => Math.PI * (h.value % (props.twentyfour ? 24 : 12) + (m.value + s.value / 60) / 60) / (props.twentyfour ? 12 : 6));
const mAngle = computed(() => Math.PI * (m.value + s.value / 60) / 30);
const sAngle = computed(() => Math.PI * s.value / 30);

function tick() {
	now.value = new Date();
	now.value.setMinutes(now.value.getMinutes() + (new Date().getTimezoneOffset() + props.offset));
}

onMounted(() => {
	const update = () => {
		if (enabled.value) {
			tick();
			window.setTimeout(update, 1000);
		}
	};
	update();
});

onBeforeUnmount(() => {
	enabled.value = false;
});
</script>

<style lang="scss" scoped>
.mbcofsoe {
	display: block;
}
</style>
