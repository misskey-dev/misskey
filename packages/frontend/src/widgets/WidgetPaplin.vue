<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" class="root">
	<div ref="paplin" class="paplin" @click="rotation" v-bind:style="{transform: `rotate(${deg}deg)`}"></div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, shallowRef } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import { i18n } from '@/i18n.js';

const name = i18n.ts._widgets.paplin;

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
		
const paplin = shallowRef<HTMLElement>();
const img = `url(https://pub-61d9927ea6b24ad7b33e1db00f6950bf.r2.dev/misskey/files/thumbnail-fa9d86ac-a94b-4226-9712-f2c687c49f74.webp)`;
let deg = 0;

const onMounted = () => {
	paplin.style.backgroundImage = img;
};

const rotation = () => {
	deg += 360;
};
</script>

<style lang="scss" module>
.root {
	width: 100%;
	height: 350px;
	border: none;
	pointer-events: none;
	color-scheme: light;

	> paplin {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
	};
}
.transition {
	transition: transform 1s ease-in-out;
}
</style>
