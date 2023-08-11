<template>
<span>{{ number(Math.floor(tweened.number)) }}</span>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
import gsap from 'gsap';
import number from '@/filters/number';

const props = defineProps<{
	value: number;
}>();

const tweened = reactive({
	number: 0,
});

watch(() => props.value, (n) => {
	gsap.to(tweened, { duration: 1, number: Number(n) || 0 });
}, {
	immediate: true,
});
</script>
