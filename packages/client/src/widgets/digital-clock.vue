<template>
<div class="mkw-digitalClock _monospace" :class="{ _panel: !widgetProps.transparent }" :style="{ fontSize: `${widgetProps.fontSize}em` }">
	<div v-if="widgetProps.showLabel" class="label">{{ tzAbbrev }}</div>
	<div class="time">
		<span v-text="hh"></span>
		<span class="colon" :class="{ showColon }">:</span>
		<span v-text="mm"></span>
		<span class="colon" :class="{ showColon }">:</span>
		<span v-text="ss"></span>
		<span v-if="widgetProps.showMs" class="colon" :class="{ showColon }">:</span>
		<span v-if="widgetProps.showMs" v-text="ms"></span>
	</div>
	<div v-if="widgetProps.showLabel" class="label">{{ tzOffsetLabel }}</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import { timezones } from '@/scripts/timezones';

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

let intervalId;
const hh = ref('');
const mm = ref('');
const ss = ref('');
const ms = ref('');
const showColon = ref(false);
let prevSec: number | null = null;

watch(showColon, (v) => {
	if (v) {
		window.setTimeout(() => {
			showColon.value = false;
		}, 30);
	}
});

const tick = () => {
	const now = new Date();
	now.setMinutes(now.getMinutes() + (new Date().getTimezoneOffset() + tzOffset));
	hh.value = now.getHours().toString().padStart(2, '0');
	mm.value = now.getMinutes().toString().padStart(2, '0');
	ss.value = now.getSeconds().toString().padStart(2, '0');
	ms.value = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
	if (now.getSeconds() !== prevSec) showColon.value = true;
	prevSec = now.getSeconds();
};

tick();

watch(() => widgetProps.showMs, () => {
	if (intervalId) window.clearInterval(intervalId);
	intervalId = window.setInterval(tick, widgetProps.showMs ? 10 : 1000);
}, { immediate: true });

onUnmounted(() => {
	window.clearInterval(intervalId);
});

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

	> .time {
		> .colon {
			opacity: 0;
			transition: opacity 1s ease;

			&.showColon {
				opacity: 1;
				transition: opacity 0s;
			}
		}
	}
}
</style>
