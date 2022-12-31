<template>
<span>{{ number(tweened.number.toFixed(0)) }}</span>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import gsap from 'gsap';
import number from '@/filters/number';

const props = defineProps<{
	value: number;
}>();

const tweened = reactive({
	number: 0,
});

watch(() => props.value, (n) => {
	gsap.to(tweened, { duration: 0.5, number: Number(n) || 0 });
}, {
	immediate: true,
});
</script>
