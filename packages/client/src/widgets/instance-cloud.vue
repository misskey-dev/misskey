<template>
<MkContainer :naked="widgetProps.transparent" :show-header="false" class="mkw-instance-cloud">
	<div class="">
		<MkTagCloud v-if="activeInstances">
			<li v-for="instance in activeInstances" :key="instance.id">
				<a @click.prevent="onInstanceClick(instance)">
					<img style="width: 32px;" :src="instance.iconUrl">
				</a>
			</li>
		</MkTagCloud>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import MkTagCloud from '@/components/MkTagCloud.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';

const name = 'instanceCloud';

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

let cloud = $ref<InstanceType<typeof MkTagCloud> | null>();
let activeInstances = $shallowRef(null);

function onInstanceClick(i) {
	os.pageWindow(`/instance-info/${i.host}`);
}

useInterval(() => {
	os.api('federation/instances', {
		sort: '+lastCommunicatedAt',
		limit: 25,
	}).then(res => {
		activeInstances = res;
		if (cloud) cloud.update();
	});
}, 1000 * 60 * 3, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>

</style>
