<template>
<MkContainer :naked="widgetProps.transparent" :show-header="false" class="mkw-clock data-cy-mkw-clock">
	<div class="vubelbmv" :class="widgetProps.size">
		<div v-if="widgetProps.label === 'tz' || widgetProps.label === 'timeAndTz'" class="_monospace label a abbrev">{{ tzAbbrev }}</div>
		<MkAnalogClock
			class="clock"
			:thickness="widgetProps.thickness"
			:offset="tzOffset"
			:graduations="widgetProps.graduations"
			:fade-graduations="widgetProps.fadeGraduations"
			:twentyfour="widgetProps.twentyFour"
			:s-animation="widgetProps.sAnimation"
		/>
		<MkDigitalClock v-if="widgetProps.label === 'time' || widgetProps.label === 'timeAndTz'" class="_monospace label c time" :show-s="false" :offset="tzOffset"/>
		<div v-if="widgetProps.label === 'tz' || widgetProps.label === 'timeAndTz'" class="_monospace label d offset">{{ tzOffsetLabel }}</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import MkAnalogClock from '@/components/MkAnalogClock.vue';
import MkDigitalClock from '@/components/MkDigitalClock.vue';
import { timezones } from '@/scripts/timezones';
import { i18n } from '@/i18n';

const name = 'clock';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	size: {
		type: 'radio' as const,
		default: 'medium',
		options: [{
			value: 'small', label: i18n.ts.small,
		}, {
			value: 'medium', label: i18n.ts.medium,
		}, {
			value: 'large', label: i18n.ts.large,
		}],
	},
	thickness: {
		type: 'radio' as const,
		default: 0.2,
		options: [{
			value: 0.1, label: 'thin',
		}, {
			value: 0.2, label: 'medium',
		}, {
			value: 0.3, label: 'thick',
		}],
	},
	graduations: {
		type: 'radio' as const,
		default: 'numbers',
		options: [{
			value: 'none', label: 'None',
		}, {
			value: 'dots', label: 'Dots',
		}, {
			value: 'numbers', label: 'Numbers',
		}],
	},
	fadeGraduations: {
		type: 'boolean' as const,
		default: true,
	},
	sAnimation: {
		type: 'radio' as const,
		default: 'elastic',
		options: [{
			value: 'none', label: 'None',
		}, {
			value: 'elastic', label: 'Elastic',
		}, {
			value: 'easeOut', label: 'Ease out',
		}],
	},
	twentyFour: {
		type: 'boolean' as const,
		default: false,
	},
	label: {
		type: 'radio' as const,
		default: 'none',
		options: [{
			value: 'none', label: 'None',
		}, {
			value: 'time', label: 'Time',
		}, {
			value: 'tz', label: 'TZ',
		}, {
			value: 'timeAndTz', label: 'Time + TZ',
		}],
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
	position: relative;

	> .label {
		position: absolute;
		opacity: 0.7;

		&.a {
			top: 14px;
			left: 14px;
		}

		&.b {
			top: 14px;
			right: 14px;
		}

		&.c {
			bottom: 14px;
			left: 14px;
		}

		&.d {
			bottom: 14px;
			right: 14px;
		}
	}

	> .clock {
		margin: auto;
	}

	&.small {
		padding: 12px;

		> .clock {
			height: 100px;
		}
	}

	&.medium {
		padding: 14px;

		> .clock {
			height: 150px;
		}
	}

	&.large {
		padding: 16px;

		> .clock {
			height: 200px;
		}
	}
}
</style>
