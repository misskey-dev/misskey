<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer data-cy-mkw-spinner class="mkw-spinner" :style="{ height: widgetProps.height + 'px' }">
	<div ref="spinner" class="spinner transition" :style="style" @click="rotation">
		<img :src="url(widgetProps.imgURL)" />
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import { url } from '@@/js/config.js';
import { random } from 'lodash';

const name = '스피너';

const widgetPropsDef = {
	imgURL: {
		type: 'string' as const,
		default: '',
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

const style = reactive({
	transition: 'transform 0.8s ease-in-out',
});
const deg = ref(0);

const rotation = () => {
	if (isNaN(deg.value)) {
		deg.value = 0;
	}
	let index = random(0,1);
	if (index == 0) {
		deg.value += random(1,12)*30;
	} else {
		deg.value -= random(1,12)*30;
	}
	style.transform = `rotate(${deg.value}deg)`;
};

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
