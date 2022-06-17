<template>
<KeepAlive max="5">
	<component :is="currentPageComponent" :key="key" v-bind="Object.fromEntries(currentPageProps)" :ref="vnode"/>
</KeepAlive>
</template>

<script lang="ts" setup>
import { inject, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { Router } from '@/nirax';
import * as symbols from '@/symbols';

const props = defineProps<{
	router?: Router;
}>();

const emit = defineEmits<{
	(ev: 'navigated', info: any): void;
}>();

const router = props.router ?? inject('router');

if (router == null) {
	throw new Error('no router provided');
}

let currentPageComponent = $ref(router.getCurrentComponent());
let currentPageProps = $ref(router.getCurrentProps());
let key = $ref(router.getCurrentKey());

function vnode(v) {
	if (v && v[symbols.PAGE_INFO]) {
		emit('navigated', v[symbols.PAGE_INFO]);
	}
}

function onChange({ route, props: newProps, key: newKey }) {
	currentPageComponent = route.component;
	currentPageProps = newProps;
	key = newKey;
}

router.addListener('change', onChange);

onUnmounted(() => {
	router.removeListener('change', onChange);
});
</script>
