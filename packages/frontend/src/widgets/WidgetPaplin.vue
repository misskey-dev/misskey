<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-paplin class="mkw-paplin">
	<template #header>paplin</template>

	<div ref="paplin" class="paplin transition" @click="rotation" :style="style">
		<img src="https://pub-61d9927ea6b24ad7b33e1db00f6950bf.r2.dev/misskey/files/thumbnail-60fd8592-2cad-4306-8ad9-c36243278e5f.webp" />
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';

const name = 'paplin';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 350,
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
const deg = ref(0);

const rotation = () => {
	if (isNaN(deg.deg)) {
		deg.deg = 0;
		style.transition = 'transform 0.8s ease-in-out';
	}
	deg.deg += 360;
	style.transform = `rotate(${deg.deg}deg)`
};

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

	> .paplin {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
	};
}
</style>
