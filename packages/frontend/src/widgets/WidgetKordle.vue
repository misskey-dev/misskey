<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-cy-mkw-kordle class="mkw-kordle" :style="{ height: widgetProps.height + 'px' }">
	<iframe :class="$style.root" src="https://kordle.kr/" ></iframe>
</div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';

const name = '꼬들';

const widgetPropsDef = {
	height: {
		type: 'number' as const,
		default: 600,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;
	
const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
	
const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const style = reactive({});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	border: none;
	pointer-events: none;
	color-scheme: light;
}
</style>
