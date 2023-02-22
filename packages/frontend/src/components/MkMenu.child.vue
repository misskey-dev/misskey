<template>
<div ref="el" class="sfhdhdhr">
	<MkMenu ref="menu" :items="items" :align="align" :width="width" :as-drawer="false" @close="onChildClosed"/>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, shallowRef, watch } from 'vue';
import MkMenu from './MkMenu.vue';
import { MenuItem } from '@/types/menu';

const props = defineProps<{
	items: MenuItem[];
	targetElement: HTMLElement;
	rootElement: HTMLElement;
	width?: number;
	viaKeyboard?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'actioned'): void;
}>();

const el = shallowRef<HTMLElement>();
const align = 'left';

function setPosition() {
	const rootRect = props.rootElement.getBoundingClientRect();
	const rect = props.targetElement.getBoundingClientRect();
	const left = props.targetElement.offsetWidth;
	const top = (rect.top - rootRect.top) - 8;
	el.value.style.left = left + 'px';
	el.value.style.top = top + 'px';
}

function onChildClosed(actioned?: boolean) {
	if (actioned) {
		emit('actioned');
	} else {
		emit('closed');
	}
}

watch(() => props.targetElement, () => {
	setPosition();
});

onMounted(() => {
	setPosition();
	nextTick(() => {
		setPosition();
	});
});

defineExpose({
	checkHit: (ev: MouseEvent) => {
		return (ev.target === el.value || el.value.contains(ev.target));
	},
});
</script>

<style lang="scss" scoped>
.sfhdhdhr {
	position: absolute;
}
</style>
