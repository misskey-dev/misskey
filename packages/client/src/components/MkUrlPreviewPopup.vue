<template>
<div class="fgmtyycl" :style="{ zIndex, top: top + 'px', left: left + 'px' }">
	<transition :name="$store.state.animation ? 'zoom' : ''" @after-leave="emit('closed')">
		<MkUrlPreview v-if="showing" class="_popup _shadow" :url="url"/>
	</transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import * as os from '@/os';

const props = defineProps<{
	showing: boolean;
	url: string;
	source: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('middle');
let top = $ref(0);
let left = $ref(0);

onMounted(() => {
	const rect = props.source.getBoundingClientRect();
	const x = Math.max((rect.left + (props.source.offsetWidth / 2)) - (300 / 2), 6) + window.pageXOffset;
	const y = rect.top + props.source.offsetHeight + window.pageYOffset;

	top = y;
	left = x;
});
</script>

<style lang="scss" scoped>
.fgmtyycl {
	position: absolute;
	width: 500px;
	max-width: calc(90vw - 12px);
	pointer-events: none;
}
</style>
