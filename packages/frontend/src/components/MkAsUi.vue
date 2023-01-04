<template>
<div :class="$style.root">
	<div v-for="def in props.definition" :key="def.id">
		<span v-if="def.type === 'text'" :class="{ [$style.fontSerif]: def.font === 'serif', [$style.fontMonospace]: def.font === 'monospace' }" :style="{ fontSize: def.size ? `${def.size * 100}%` : null, fontWeight: def.bold ? 'bold' : null, color: def.color ?? null }">{{ def.text }}</span>
		<Mfm v-else-if="def.type === 'mfm'" :class="{ [$style.fontSerif]: def.font === 'serif', [$style.fontMonospace]: def.font === 'monospace' }" :style="{ fontSize: def.size ? `${def.size * 100}%` : null, color: def.color ?? null }" :text="def.text"/>
		<MkButton v-else-if="def.type === 'button'" :primary="def.primary" :rounded="def.rounded" :small="size === 'small'" @click="def.onClick">{{ def.text }}</MkButton>
		<div v-else-if="def.type === 'buttons'" style="display: flex; gap: 8px; flex-wrap: wrap;">
			<MkButton v-for="button in def.buttons" :primary="button.primary" :rounded="button.rounded" :small="size === 'small'" @click="button.onClick">{{ button.text }}</MkButton>
		</div>
		<MkSwitch v-else-if="def.type === 'switch'" :model-value="def.default" @update:model-value="def.onChange">
			<template v-if="def.label" #label>{{ def.label }}</template>
			<template v-if="def.caption" #caption>{{ def.caption }}</template>
		</MkSwitch>
		<MkInput v-else-if="def.type === 'textInput'" :small="size === 'small'" :model-value="def.default" @update:model-value="def.onInput">
			<template v-if="def.label" #label>{{ def.label }}</template>
			<template v-if="def.caption" #caption>{{ def.caption }}</template>
		</MkInput>
		<MkInput v-else-if="def.type === 'numberInput'" :small="size === 'small'" :model-value="def.default" type="number" @update:model-value="def.onInput">
			<template v-if="def.label" #label>{{ def.label }}</template>
			<template v-if="def.caption" #caption>{{ def.caption }}</template>
		</MkInput>
		<div v-else-if="def.type === 'container'" :class="[$style.container, { [$style.fontSerif]: def.font === 'serif', [$style.fontMonospace]: def.font === 'monospace', [$style.containerCenter]: def.align === 'center' }]" :style="{ backgroundColor: def.bgColor ?? null, color: def.fgColor ?? null, borderWidth: def.borderWidth ? `${def.borderWidth}px` : 0, borderColor: def.borderColor ?? 'var(--divider)', padding: def.padding ? `${def.padding}px` : 0, borderRadius: def.rounded ? '8px' : 0 }">
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
import MkSwitch from '@/components/form/switch.vue';
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

.fontSerif {
	font-family: serif;
}

.fontMonospace {
	font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
}
</style>
