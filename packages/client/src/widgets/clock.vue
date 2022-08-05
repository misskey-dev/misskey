<template>
<MkContainer :naked="widgetProps.transparent" :show-header="false" class="mkw-clock">
	<div class="vubelbmv">
		<div v-if="widgetProps.showLabel" class="label abbrev">{{ tzAbbrev }}</div>
		<MkAnalogClock class="clock" :thickness="widgetProps.thickness" :offset="tzOffset" :numbers="widgetProps.numbers" :twentyfour="widgetProps.twentyFour"/>
		<div v-if="widgetProps.showLabel" class="label offset">{{ tzOffsetLabel }}</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/ui/container.vue';
import MkAnalogClock from '@/components/analog-clock.vue';
import { timezones } from '@/scripts/timezones';

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
			value: 0.1, label: 'thin',
		}, {
			value: 0.2, label: 'medium',
		}, {
			value: 0.3, label: 'thick',
		}],
	},
	numbers: {
		type: 'boolean' as const,
		default: false,
	},
	twentyFour: {
		type: 'boolean' as const,
		default: false,
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
.vubelbmv {
	padding: 8px;
	position: relative;

	> .label {
		opacity: 0.7;

		&.abbrev {
			position: absolute;
			top: 14px;
			left: 14px;
		}

		&.offset {
			position: absolute;
			bottom: 14px;
			right: 14px;
		}
	}

	> .clock {
		height: 150px;
		margin: auto;
	}
}
</style>
