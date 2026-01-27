<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" data-cy-mkw-aichan class="mkw-aichan">
	<iframe ref="live2d" :class="$style.root" src="https://misskey-dev.github.io/mascot-web/?scale=1.5&y=1.1&eyeY=100" @click="touched"></iframe>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import { i18n } from '@/i18n.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';

const name = 'aichan';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.transparent,
		default: false,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const live2d = useTemplateRef('live2d');

const touched = () => {
	//if (this.live2d) this.live2d.changeExpression('gurugurume');
};

const onMousemove = (ev: MouseEvent) => {
	if (!live2d.value || !live2d.value.contentWindow) return;

	const iframeRect = live2d.value.getBoundingClientRect();
	live2d.value.contentWindow.postMessage({
		type: 'moveCursor',
		body: {
			x: ev.clientX - iframeRect.left,
			y: ev.clientY - iframeRect.top,
		},
	}, '*');
};

onMounted(() => {
	window.addEventListener('mousemove', onMousemove, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener('mousemove', onMousemove);
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	width: 100%;
	height: 350px;
	border: none;
	pointer-events: none;
	color-scheme: light;
}
</style>
