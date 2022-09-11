<template>
<div class="mkw-digitalClock _monospace" :class="{ _panel: !widgetProps.transparent }" :style="{ fontSize: `${widgetProps.fontSize}em` }">
	<div v-if="widgetProps.showLabel" class="label">{{ tzAbbrev }}</div>
	<div class="time">
		<MkDigitalClock :show-ms="widgetProps.showMs" :offset="tzOffset"/>
	</div>
	<div v-if="widgetProps.showLabel" class="label">{{ tzOffsetLabel }}</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import { timezones } from '@/scripts/timezones';
import MkDigitalClock from '@/components/MkDigitalClock.vue';

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
	showLabel: {
		type: 'boolean' as const,
		default: true,
	},
	timezone: {
		type: 'enum' as const,
		default: null,
		enum: [...timezones.map((tz) => ({
			label: tz.name,
			value: tz.name.toLowerCase(),
		})), {
			label: '(auto)',
			value: null,
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

const tzAbbrev = $computed(() => (widgetProps.timezone === null
	? timezones.find((tz) => tz.name.toLowerCase() === Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase())?.abbrev
	: timezones.find((tz) => tz.name.toLowerCase() === widgetProps.timezone)?.abbrev) ?? '?');

const tzOffset = $computed(() => widgetProps.timezone === null
	? 0 - new Date().getTimezoneOffset()
	: timezones.find((tz) => tz.name.toLowerCase() === widgetProps.timezone)?.offset ?? 0);

const tzOffsetLabel = $computed(() => (tzOffset >= 0 ? '+' : '-') + Math.floor(tzOffset / 60).toString().padStart(2, '0') + ':' + (tzOffset % 60).toString().padStart(2, '0'));

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.mkw-digitalClock {
	padding: 16px 0;
	text-align: center;

	> .label {
		font-size: 65%;
		opacity: 0.7;
	}
}
</style>
