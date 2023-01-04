<template>
<div :class="$style.root">
	<XComponent v-for="c in componentsToRender" :key="c.value.id" :component="c" :components="props.components"/>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, Ref } from 'vue';
import * as os from '@/os';
import XComponent from '@/components/MkAsUi.component.vue';
import { AsUiComponent } from '@/scripts/aiscript/ui';

const props = withDefaults(defineProps<{
	ids: AsUiComponent['id'][];
	components: Ref<AsUiComponent>[];
	size: 'small' | 'medium' | 'large';
}>(), {
	size: 'medium',
});

const componentsToRender = computed(() => props.ids.map(id => props.components.find(c => c.value.id === id)!));
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
