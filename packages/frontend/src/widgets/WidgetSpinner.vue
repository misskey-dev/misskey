<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer data-cy-mkw-spinner class="mkw-spinner" >
	<div ref="spinner" class="spinner-box transition" :style="{ height: widgetProps.height + 'px', transform: `rotate(${widgetProps.degree}deg)`}" @click="rotation">
		<img class="spinner" :src="widgetProps.imgURL" />
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';

const name = '스피너';

const widgetPropsDef = {
	imgURL: {
		type: 'string' as const,
		default: 'https://i.imgur.com/PnzFrT3.png',
	},
	height: {
		type: 'number' as const,
		default: 350,
	},
	fullThrottle: {
		type: 'boolean' as const,
		default: false,
	},
	degree: {
		type: 'number' as const,
		default: 0,
		hidden: true,
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

const deg = ref(0);

const rotation = () => {
	if (isNaN(deg.value)) {
		deg.value = 0;
	}
	let index = Math.round(Math.random());
	let value = widgetProps.fullThrottle ? 360 : (Math.floor(Math.random()*12)+1)*30
	deg.value = index == 0 ? deg.value + value : deg.value - value
	widgetProps.degree = deg.value;
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.spinner-box {
	display: flex;
	justify-content: center;
	align-items: center;
	transition: transform 0.8s ease-in-out;

	> .spinner {
		position: absolute;
		width: 90%;
		height: 90%;
	};
};
</style>
