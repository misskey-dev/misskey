<template>
<MkContainer :naked="widgetProps.transparent" :show-header="false" class="mkw-clock">
	<div class="vubelbmv">
		<MkAnalogClock class="clock" :thickness="widgetProps.thickness"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { GetFormResultType } from '@/scripts/form';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import MkContainer from '@/components/ui/container.vue';
import MkAnalogClock from '@/components/analog-clock.vue';

const name = 'clock';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	thickness: {
		type: 'radio' as const,
		default: 0.1,
		options: [{
			value: 0.1, label: 'thin'
		}, {
			value: 0.2, label: 'medium'
		}, {
			value: 0.3, label: 'thick'
		}],
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

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.vubelbmv {
	padding: 8px;

	> .clock {
		height: 150px;
		margin: auto;
	}
}
</style>
