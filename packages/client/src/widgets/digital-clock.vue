<template>
<div class="mkw-digitalClock _monospace" :class="{ _panel: !widgetProps.transparent }" :style="{ fontSize: `${widgetProps.fontSize}em` }">
	<span>
		<span v-text="hh"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="mm"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="ss"></span>
		<span v-if="widgetProps.showMs" :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-if="widgetProps.showMs" v-text="ms"></span>
	</span>
</div>
</template>

<script lang="ts" setup>
import { GetFormResultType } from '@/scripts/form';
import { onUnmounted, ref, watch } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';

const name = 'digitalClock';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	fontSize: {
		type: 'number' as const,
		default: 1.5,
		step: 0.1,
	},
	showMs: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, oepnConfig } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

let intervalId;
const hh = ref('');
const mm = ref('');
const ss = ref('');
const ms = ref('');
const showColon = ref(true);
const tick = () => {
	const now = new Date();
	hh.value = now.getHours().toString().padStart(2, '0');
	mm.value = now.getMinutes().toString().padStart(2, '0');
	ss.value = now.getSeconds().toString().padStart(2, '0');
	ms.value = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
	showColon.value = now.getSeconds() % 2 === 0;
};

tick();

watch(() => widgetProps.showMs, () => {
	if (intervalId) clearInterval(intervalId);
	intervalId = setInterval(intervalId, widgetProps.showMs ? 10 : 1000);
}, { immediate: true });

onUnmounted(() => {
	clearInterval(intervalId);
});

defineExpose<WidgetComponentExpose>({
	name,
	oepnConfig,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.mkw-digitalClock {
	padding: 16px 0;
	text-align: center;
}
</style>
