<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" class="mkw-paplin">
	<img :class="transition" src="https://pub-61d9927ea6b24ad7b33e1db00f6950bf.r2.dev/misskey/files/thumbnail-fa9d86ac-a94b-4226-9712-f2c687c49f74.webp" @click="OnClick" v-bind:style="{transform: `rotate(${deg}deg)`}" alt="refresh-icon-btn" />
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, shallowRef } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';

const name = 'paplin';

const deg = 0;

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
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

const OnClick = () => {
	this.deg += 360;
	//if (this.live2d) this.live2d.changeExpression('gurugurume');
};

onMounted(() => {
	window.addEventListener('mousemove', onMousemove, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener('mousemove', onMousemove);
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
.transition {
	transition: transform 1s ease-in-out;
}
</style>
