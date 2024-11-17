<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-paplin class="mkw-paplin">
	<template #header>{{ i18n.ts._widgets.paplin }}</template>

	<div ref="paplin" class="paplin" @click="rotation" :style="style">
		<img src="https://pub-61d9927ea6b24ad7b33e1db00f6950bf.r2.dev/misskey/files/thumbnail-516fe5e1-88e2-4cc7-9b43-e1a3cbd7ced9.webp" />
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import { i18n } from '@/i18n.js';

const name = i18n.ts._widgets.paplin;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 100,
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
		deg.deg = 0
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
