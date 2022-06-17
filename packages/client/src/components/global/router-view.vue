<template>
<component :is="currentPageComponent" v-bind="Object.fromEntries(currentPageProps)"/>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted, watch } from 'vue';
import { Router } from '@/router/router';

const props = defineProps<{
	router?: Router;
}>();

const router = props.router ?? inject('router');

if (router == null) {
	throw new Error('no router provided');
}

let currentPageComponent = $ref(router.getCurrentComponent());
let currentPageProps = $ref(router.getCurrentProps());

console.log(currentPageComponent, currentPageProps);

function onChange({ route, props: newProps }) {
	currentPageComponent = route.component;
	currentPageProps = newProps;
}

router.addListener('change', onChange);

onUnmounted(() => {
	router.removeListener('change', onChange);
});
</script>
