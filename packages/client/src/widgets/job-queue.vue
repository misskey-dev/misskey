<template>
<div class="mkw-jobQueue _monospace" :class="{ _panel: !props.transparent }">
	<div class="inbox">
		<div class="label">Inbox queue<i v-if="inbox.waiting > 0" class="fas fa-exclamation-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: inbox.activeSincePrevTick > prev.inbox.activeSincePrevTick, dec: inbox.activeSincePrevTick < prev.inbox.activeSincePrevTick }">{{ number(inbox.activeSincePrevTick) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: inbox.active > prev.inbox.active, dec: inbox.active < prev.inbox.active }">{{ number(inbox.active) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: inbox.delayed > prev.inbox.delayed, dec: inbox.delayed < prev.inbox.delayed }">{{ number(inbox.delayed) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: inbox.waiting > prev.inbox.waiting, dec: inbox.waiting < prev.inbox.waiting }">{{ number(inbox.waiting) }}</div>
			</div>
		</div>
	</div>
	<div class="deliver">
		<div class="label">Deliver queue<i v-if="deliver.waiting > 0" class="fas fa-exclamation-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: deliver.activeSincePrevTick > prev.deliver.activeSincePrevTick, dec: deliver.activeSincePrevTick < prev.deliver.activeSincePrevTick }">{{ number(deliver.activeSincePrevTick) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: deliver.active > prev.deliver.active, dec: deliver.active < prev.deliver.active }">{{ number(deliver.active) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: deliver.delayed > prev.deliver.delayed, dec: deliver.delayed < prev.deliver.delayed }">{{ number(deliver.delayed) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: deliver.waiting > prev.deliver.waiting, dec: deliver.waiting < prev.deliver.waiting }">{{ number(deliver.waiting) }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import define from './define';
import * as os from '@/os';
import number from '@/filters/number';
import * as sound from '@/scripts/sound';

const widget = define({
	name: 'jobQueue',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: false,
		},
		sound: {
			type: 'boolean',
			default: false,
		},
	})
});

export default defineComponent({
	extends: widget,
	data() {
		return {
			connection: markRaw(os.stream.useChannel('queueStats')),
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
			prev: {},
			sound: sound.setVolume(sound.getAudio('syuilo/queue-jammed'), 1)
		};
	},
	created() {
		for (const domain of ['inbox', 'deliver']) {
			this.prev[domain] = JSON.parse(JSON.stringify(this[domain]));
		}
	
		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);

		this.connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 1
		});
	},
	beforeUnmount() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
		this.connection.dispose();
	},
	methods: {
		onStats(stats) {
			for (const domain of ['inbox', 'deliver']) {
				this.prev[domain] = JSON.parse(JSON.stringify(this[domain]));
				this[domain].activeSincePrevTick = stats[domain].activeSincePrevTick;
				this[domain].active = stats[domain].active;
				this[domain].waiting = stats[domain].waiting;
				this[domain].delayed = stats[domain].delayed;

				if (this[domain].waiting > 0 && this.props.sound && this.sound.paused) {
					this.sound.play();
				}
			}
		},

		onStatsLog(statsLog) {
			for (const stats of [...statsLog].reverse()) {
				this.onStats(stats);
			}
		},

		number
	}
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
