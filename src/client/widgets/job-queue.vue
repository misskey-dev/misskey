<template>
<div class="mkw-jobQueue _monospace" :class="{ _panel: !props.transparent }">
	<div class="inbox">
		<div class="label">Inbox queue<Fa :icon="faExclamationTriangle" v-if="inbox.waiting > 0" class="icon"/></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div>{{ number(inbox.activeSincePrevTick) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div>{{ number(inbox.active) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div>{{ number(inbox.delayed) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div>{{ number(inbox.waiting) }}</div>
			</div>
		</div>
	</div>
	<div class="deliver">
		<div class="label">Deliver queue<Fa :icon="faExclamationTriangle" v-if="inbox.waiting > 0" class="icon"/></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div>{{ number(deliver.activeSincePrevTick) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div>{{ number(deliver.active) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div>{{ number(deliver.delayed) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div>{{ number(deliver.waiting) }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import define from './define';
import * as os from '@/os';
import number from '@/filters/number';

const widget = define({
	name: 'jobQueue',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: false,
		},
	})
});

export default defineComponent({
	extends: widget,
	data() {
		return {
			connection: os.stream.useSharedConnection('queueStats'),
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
			faExclamationTriangle,
		};
	},
	created() {
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
				this[domain].activeSincePrevTick = stats[domain].activeSincePrevTick;
				this[domain].active = stats[domain].active;
				this[domain].waiting = stats[domain].waiting;
				this[domain].delayed = stats[domain].delayed;
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
	> div {
		padding: 16px;

		&:not(:first-child) {
			border-top: solid 1px var(--divider);
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
					font-size: 0.9em;
				}
			}
		}
	}
}
</style>
