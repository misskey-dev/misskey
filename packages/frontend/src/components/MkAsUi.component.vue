<template>
<div>
	<span v-if="c.type === 'text'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, fontWeight: c.bold ? 'bold' : null, color: c.color ?? null }">{{ c.text }}</span>
	<Mfm v-else-if="c.type === 'mfm'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, color: c.color ?? null }" :text="c.text"/>
	<MkButton v-else-if="c.type === 'button'" :primary="c.primary" :rounded="c.rounded" :small="size === 'small'" @click="c.onClick">{{ c.text }}</MkButton>
	<div v-else-if="c.type === 'buttons'" style="display: flex; gap: 8px; flex-wrap: wrap;">
		<MkButton v-for="button in c.buttons" :primary="button.primary" :rounded="button.rounded" :small="size === 'small'" @click="button.onClick">{{ button.text }}</MkButton>
	</div>
	<MkSwitch v-else-if="c.type === 'switch'" :model-value="c.default" @update:model-value="c.onChange">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkSwitch>
	<MkInput v-else-if="c.type === 'textInput'" :small="size === 'small'" :model-value="c.default" @update:model-value="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkInput v-else-if="c.type === 'numberInput'" :small="size === 'small'" :model-value="c.default" type="number" @update:model-value="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<div v-else-if="c.type === 'container'" :class="[$style.container, { [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace', [$style.containerCenter]: c.align === 'center' }]" :style="{ backgroundColor: c.bgColor ?? null, color: c.fgColor ?? null, borderWidth: c.borderWidth ? `${c.borderWidth}px` : 0, borderColor: c.borderColor ?? 'var(--divider)', padding: c.padding ? `${c.padding}px` : 0, borderRadius: c.rounded ? '8px' : 0 }">
		<MkAsUi :ids="c.children" :components="props.components" :size="size"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, Ref } from 'vue';
import * as os from '@/os';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/form/input.vue';
import MkSwitch from '@/components/form/switch.vue';
import { AsUiComponent } from '@/scripts/aiscript/ui';
import MkAsUi from '@/components/MkAsUi.vue';

const props = withDefaults(defineProps<{
	component: Ref<AsUiComponent>;
	components: Ref<AsUiComponent>[];
	size: 'small' | 'medium' | 'large';
}>(), {
	size: 'medium',
});

const c = props.component.value;
</script>

<style lang="scss" module>
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
