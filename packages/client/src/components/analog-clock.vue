<template>
<svg class="mbcofsoe" viewBox="0 0 10 10" preserveAspectRatio="none">
	<circle v-for="(angle, i) in graduations"
					:key="i"
					:cx="5 + (Math.sin(angle) * (5 - graduationsPadding))"
					:cy="5 - (Math.cos(angle) * (5 - graduationsPadding))"
					:r="i % 5 == 0 ? 0.125 : 0.05"
					:fill="i % 5 == 0 ? majorGraduationColor : minorGraduationColor"
	/>

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

withDefaults(defineProps<{
	thickness: number;
}>(), {
	thickness: 0.1,
});

const now = ref(new Date());
const enabled = ref(true);
const graduationsPadding = ref(0.5);
const handsPadding = ref(1);
const handsTailLength = ref(0.7);
const hHandLengthRatio = ref(0.75);
const mHandLengthRatio = ref(1);
const sHandLengthRatio = ref(1);
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
const hAngle = computed(() => Math.PI * (h.value % 12 + (m.value + s.value / 60) / 60) / 6);
const mAngle = computed(() => Math.PI * (m.value + s.value / 60) / 30);
const sAngle = computed(() => Math.PI * s.value / 30);
const graduations = computed(() => {
	const angles: number[] = [];
	for (let i = 0; i < 60; i++) {
		const angle = Math.PI * i / 30;
		angles.push(angle);
	}

	return angles;
});

function tick() {
	now.value = new Date();
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
