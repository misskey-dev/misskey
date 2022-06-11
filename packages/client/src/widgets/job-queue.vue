<template>
<div class="mkw-jobQueue _monospace" :class="{ _panel: !widgetProps.transparent }">
	<div class="inbox">
		<div class="label">Inbox queue<i v-if="current.inbox.waiting > 0" class="fas fa-exclamation-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: current.inbox.activeSincePrevTick > prev.inbox.activeSincePrevTick, dec: current.inbox.activeSincePrevTick < prev.inbox.activeSincePrevTick }">{{ number(current.inbox.activeSincePrevTick) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: current.inbox.active > prev.inbox.active, dec: current.inbox.active < prev.inbox.active }">{{ number(current.inbox.active) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: current.inbox.delayed > prev.inbox.delayed, dec: current.inbox.delayed < prev.inbox.delayed }">{{ number(current.inbox.delayed) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: current.inbox.waiting > prev.inbox.waiting, dec: current.inbox.waiting < prev.inbox.waiting }">{{ number(current.inbox.waiting) }}</div>
			</div>
		</div>
	</div>
	<div class="deliver">
		<div class="label">Deliver queue<i v-if="current.deliver.waiting > 0" class="fas fa-exclamation-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: current.deliver.activeSincePrevTick > prev.deliver.activeSincePrevTick, dec: current.deliver.activeSincePrevTick < prev.deliver.activeSincePrevTick }">{{ number(current.deliver.activeSincePrevTick) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: current.deliver.active > prev.deliver.active, dec: current.deliver.active < prev.deliver.active }">{{ number(current.deliver.active) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: current.deliver.delayed > prev.deliver.delayed, dec: current.deliver.delayed < prev.deliver.delayed }">{{ number(current.deliver.delayed) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: current.deliver.waiting > prev.deliver.waiting, dec: current.deliver.waiting < prev.deliver.waiting }">{{ number(current.deliver.waiting) }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { GetFormResultType } from '@/scripts/form';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { stream } from '@/stream';
import number from '@/filters/number';
import * as sound from '@/scripts/sound';
import * as os from '@/os';

const name = 'jobQueue';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	sound: {
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

const connection = stream.useChannel('queueStats');
const current = reactive({
	inbox: {
		activeSincePrevTick: 0,
		active: 0,
		waiting: 0,
		delayed: 0,
	},
	deliver: {
		activeSincePrevTick: 0,
		active: 0,
		waiting: 0,
		delayed: 0,
	},
});
const prev = reactive({} as typeof current);
const jammedSound = sound.setVolume(sound.getAudio('syuilo/queue-jammed'), 1);

for (const domain of ['inbox', 'deliver']) {
	prev[domain] = JSON.parse(JSON.stringify(current[domain]));
}

const onStats = (stats) => {
	for (const domain of ['inbox', 'deliver']) {
		prev[domain] = JSON.parse(JSON.stringify(current[domain]));
		current[domain].activeSincePrevTick = stats[domain].activeSincePrevTick;
		current[domain].active = stats[domain].active;
		current[domain].waiting = stats[domain].waiting;
		current[domain].delayed = stats[domain].delayed;

		if (current[domain].waiting > 0 && widgetProps.sound && jammedSound.paused) {
			jammedSound.play();
		}
	}
};

const onStatsLog = (statsLog) => {
	for (const stats of [...statsLog].reverse()) {
		onStats(stats);
	}
};

connection.on('stats', onStats);
connection.on('statsLog', onStatsLog);

connection.send('requestLog', {
	id: Math.random().toString().substr(2, 8),
	length: 1,
});

onUnmounted(() => {
	connection.off('stats', onStats);
	connection.off('statsLog', onStatsLog);
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
@keyframes warnBlink {
	0% { opacity: 1; }
	50% { opacity: 0; }
}

.mkw-jobQueue {
	font-size: 0.9em;

	> div {
		padding: 16px;

		&:not(:first-child) {
			border-top: solid 0.5px var(--divider);
		}

		> .label {
			display: flex;

			> .icon {
				color: var(--warn);
				margin-left: auto;
				animation: warnBlink 1s infinite;
			}
		}

		> .values {
			display: flex;

			> div {
				flex: 1;

				> div:first-child {
					opacity: 0.7;
				}

				> div:last-child {
					&.inc {
						color: var(--warn);
					}

					&.dec {
						color: var(--success);
					}
				}
			}
		}
	}
}
</style>
