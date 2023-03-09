<template>
<MkContainer :naked="widgetProps.transparent" :show-header="false" data-cy-mkw-aichan class="mkw-aichan">
	<iframe ref="live2d" class="dedjhjmo" src="https://misskey-dev.github.io/mascot-web/?scale=1.5&y=1.1&eyeY=100" @click="touched"></iframe>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, shallowRef } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';

const name = 'ai';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const live2d = shallowRef<HTMLIFrameElement>();

const touched = () => {
	//if (this.live2d) this.live2d.changeExpression('gurugurume');
};

const onMousemove = (ev: MouseEvent) => {
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

<style lang="scss" scoped>
.dedjhjmo {
	width: 100%;
	height: 350px;
	border: none;
	pointer-events: none;
}
</style>
