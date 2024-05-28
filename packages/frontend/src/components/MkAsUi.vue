<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-if="c.type === 'root'" :class="$style.root">
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size"/>
		</template>
	</div>
	<span v-else-if="c.type === 'text'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : undefined, fontWeight: c.bold ? 'bold' : undefined, color: c.color }">{{ c.text }}</span>
	<Mfm v-else-if="c.type === 'mfm'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, fontWeight: c.bold ? 'bold' : null, color: c.color ?? null }" :text="c.text ?? ''" @clickEv="c.onClickEv"/>
	<MkButton v-else-if="c.type === 'button'" :primary="c.primary" :rounded="c.rounded" :disabled="c.disabled" :small="size === 'small'" inline @click="c.onClick">{{ c.text }}</MkButton>
	<div v-else-if="c.type === 'buttons'" class="_buttons" :style="{ justifyContent: align }">
		<MkButton v-for="button in c.buttons" :primary="button.primary" :rounded="button.rounded" :disabled="button.disabled" inline :small="size === 'small'" @click="button.onClick">{{ button.text }}</MkButton>
	</div>
	<MkSwitch v-else-if="c.type === 'switch'" :modelValue="valueForSwitch" @update:modelValue="onSwitchUpdate">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkSwitch>
	<MkTextarea v-else-if="c.type === 'textarea'" :modelValue="c.default ?? null" @update:modelValue="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkTextarea>
	<MkInput v-else-if="c.type === 'textInput'" :small="size === 'small'" :modelValue="c.default ?? null" @update:modelValue="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkInput v-else-if="c.type === 'numberInput'" :small="size === 'small'" :modelValue="c.default ?? null" type="number" @update:modelValue="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkSelect v-else-if="c.type === 'select'" :small="size === 'small'" :modelValue="c.default ?? null" @update:modelValue="c.onChange">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
		<option v-for="item in c.items" :key="item.value" :value="item.value">{{ item.text }}</option>
	</MkSelect>
	<MkButton v-else-if="c.type === 'postFormButton'" :primary="c.primary" :rounded="c.rounded" :small="size === 'small'" inline @click="openPostForm">{{ c.text }}</MkButton>
	<div v-else-if="c.type === 'postForm'" :class="$style.postForm">
		<MkPostForm
			fixed
			:instant="true"
			:initialText="c.form?.text"
			:initialCw="c.form?.cw"
			:initialVisibility="c.form?.visibility"
			:initialLocalOnly="c.form?.localOnly"
		/>
	</div>
	<MkFolder v-else-if="c.type === 'folder'" :defaultOpen="c.opened">
		<template #label>{{ c.title }}</template>
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size"/>
		</template>
	</MkFolder>
	<div v-else-if="c.type === 'container'" :class="[$style.container, { [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }]" :style="{ textAlign: c.align, backgroundColor: c.bgColor, color: c.fgColor, borderWidth: c.borderWidth ? `${c.borderWidth}px` : 0, borderColor: c.borderColor ?? 'var(--divider)', padding: c.padding ? `${c.padding}px` : 0, borderRadius: c.rounded ? '8px' : 0 }">
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size" :align="c.align"/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { Ref, ref } from 'vue';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import { AsUiComponent, AsUiRoot, AsUiPostFormButton } from '@/scripts/aiscript/ui.js';
import MkFolder from '@/components/MkFolder.vue';
import MkPostForm from '@/components/MkPostForm.vue';

const props = withDefaults(defineProps<{
	component: AsUiComponent;
	components: Ref<AsUiComponent>[];
	size: 'small' | 'medium' | 'large';
	align: 'left' | 'center' | 'right';
}>(), {
	size: 'medium',
	align: 'left',
});

const c = props.component;

function g(id) {
	const v = props.components.find(x => x.value.id === id)?.value;
	if (v) return v;

	return {
		id: 'dummy',
		type: 'root',
		children: [],
	} as AsUiRoot;
}

const valueForSwitch = ref('default' in c && typeof c.default === 'boolean' ? c.default : false);

function onSwitchUpdate(v) {
	valueForSwitch.value = v;
	if ('onChange' in c && c.onChange) {
		c.onChange(v as never);
	}
}

function openPostForm() {
	const form = (c as AsUiPostFormButton).form;
	if (!form) return;

	os.post({
		initialText: form.text,
		initialCw: form.cw,
		initialVisibility: form.visibility,
		initialLocalOnly: form.localOnly,
		instant: true,
	});
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.container {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.fontSerif {
	font-family: serif;
}

.fontMonospace {
	font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
}

.postForm {
	background: var(--bg);
	border-radius: 8px;
}
</style>
