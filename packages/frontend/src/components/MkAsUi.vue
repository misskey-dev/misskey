<template>
<div :class="$style.root">
	<div v-for="def in props.definition" :key="def.id">
		<span v-if="def.type === 'text'" :style="{ fontSize: def.size ? `${def.size * 100}%` : null, fontWeight: def.bold ? 'bold' : null }">{{ def.text }}</span>
		<MkButton v-else-if="def.type === 'button'" :primary="def.primary" :rounded="def.rounded" :small="size === 'small'" @click="def.onClick">{{ def.text }}</MkButton>
		<div v-else-if="def.type === 'buttons'" style="display: flex; gap: 8px; flex-wrap: wrap;">
			<MkButton v-for="button in def.buttons" :primary="button.primary" :rounded="button.rounded" :small="size === 'small'" @click="button.onClick">{{ button.text }}</MkButton>
		</div>
		<MkInput v-else-if="def.type === 'textInput'" :small="size === 'small'" @update:model-value="def.onInput"></MkInput>
		<div v-else-if="def.type === 'container'" :class="[$style.container, { [$style.containerCenter]: def.align === 'center' }]">
			<MkAsUi :definition="def.children" :size="size"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import * as os from '@/os';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/form/input.vue';
import { AsUiComponent } from '@/scripts/aiscript/ui';

const props = withDefaults(defineProps<{
	definition: AsUiComponent[];
	size: 'small' | 'medium' | 'large';
}>(), {
	size: 'medium',
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.containerCenter {
	text-align: center;
}
</style>
