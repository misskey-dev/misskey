<template>
<div class="taeiyria">
	<div class="query">
		<MkInput v-model="host" :debounce="true" class="_inputNoTopMargin">
			<template #prefix><i class="fas fa-search"></i></template>
			<template #label>{{ $ts.host }}</template>
		</MkInput>
		<div class="_inputSplit _inputNoBottomMargin">
			<MkSelect v-model="state">
				<template #label>{{ $ts.state }}</template>
				<option value="all">{{ $ts.all }}</option>
				<option value="federating">{{ $ts.federating }}</option>
				<option value="subscribing">{{ $ts.subscribing }}</option>
				<option value="publishing">{{ $ts.publishing }}</option>
				<option value="suspended">{{ $ts.suspended }}</option>
				<option value="blocked">{{ $ts.blocked }}</option>
				<option value="notResponding">{{ $ts.notResponding }}</option>
			</MkSelect>
			<MkSelect v-model="sort">
				<template #label>{{ $ts.sort }}</template>
				<option value="+pubSub">{{ $ts.pubSub }} ({{ $ts.descendingOrder }})</option>
				<option value="-pubSub">{{ $ts.pubSub }} ({{ $ts.ascendingOrder }})</option>
				<option value="+notes">{{ $ts.notes }} ({{ $ts.descendingOrder }})</option>
				<option value="-notes">{{ $ts.notes }} ({{ $ts.ascendingOrder }})</option>
				<option value="+users">{{ $ts.users }} ({{ $ts.descendingOrder }})</option>
				<option value="-users">{{ $ts.users }} ({{ $ts.ascendingOrder }})</option>
				<option value="+following">{{ $ts.following }} ({{ $ts.descendingOrder }})</option>
				<option value="-following">{{ $ts.following }} ({{ $ts.ascendingOrder }})</option>
				<option value="+followers">{{ $ts.followers }} ({{ $ts.descendingOrder }})</option>
				<option value="-followers">{{ $ts.followers }} ({{ $ts.ascendingOrder }})</option>
				<option value="+caughtAt">{{ $ts.caughtAt }} ({{ $ts.descendingOrder }})</option>
				<option value="-caughtAt">{{ $ts.caughtAt }} ({{ $ts.ascendingOrder }})</option>
				<option value="+lastCommunicatedAt">{{ $ts.lastCommunicatedAt }} ({{ $ts.descendingOrder }})</option>
				<option value="-lastCommunicatedAt">{{ $ts.lastCommunicatedAt }} ({{ $ts.ascendingOrder }})</option>
				<option value="+driveUsage">{{ $ts.driveUsage }} ({{ $ts.descendingOrder }})</option>
				<option value="-driveUsage">{{ $ts.driveUsage }} ({{ $ts.ascendingOrder }})</option>
				<option value="+driveFiles">{{ $ts.driveFiles }} ({{ $ts.descendingOrder }})</option>
				<option value="-driveFiles">{{ $ts.driveFiles }} ({{ $ts.ascendingOrder }})</option>
			</MkSelect>
		</div>
	</div>

	<MkPagination :pagination="pagination" #default="{items}" ref="instances" :key="host + state">
		<div class="dqokceoi">
			<MkA class="instance" v-for="instance in items" :key="instance.id" :to="`/instance-info/${instance.host}`">
				<div class="host"><img :src="instance.faviconUrl">{{ instance.host }}</div>
				<div class="table">
					<div class="cell">
						<div class="key">{{ $ts.registeredAt }}</div>
						<div class="value"><MkTime :time="instance.caughtAt"/></div>
					</div>
					<div class="cell">
						<div class="key">{{ $ts.software }}</div>
						<div class="value">{{ instance.softwareName || `(${$ts.unknown})` }}</div>
					</div>
					<div class="cell">
						<div class="key">{{ $ts.version }}</div>
						<div class="value">{{ instance.softwareVersion || `(${$ts.unknown})` }}</div>
					</div>
					<div class="cell">
						<div class="key">{{ $ts.users }}</div>
						<div class="value">{{ instance.usersCount }}</div>
					</div>
					<div class="cell">
						<div class="key">{{ $ts.notes }}</div>
						<div class="value">{{ instance.notesCount }}</div>
					</div>
					<div class="cell">
						<div class="key">{{ $ts.sent }}</div>
						<div class="value"><MkTime v-if="instance.latestRequestSentAt" :time="instance.latestRequestSentAt"/><span v-else>N/A</span></div>
					</div>
					<div class="cell">
						<div class="key">{{ $ts.received }}</div>
						<div class="value"><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></div>
					</div>
				</div>
				<div class="footer">
					<span class="status" :class="getStatus(instance)">{{ getStatus(instance) }}</span>
					<span class="pubSub">
						<span class="sub" v-if="instance.followersCount > 0"><i class="fas fa-caret-down icon"></i>Sub</span>
						<span class="sub" v-else><i class="fas fa-caret-down icon"></i>-</span>
						<span class="pub" v-if="instance.followingCount > 0"><i class="fas fa-caret-up icon"></i>Pub</span>
						<span class="pub" v-else><i class="fas fa-caret-up icon"></i>-</span>
					</span>
					<span class="right">
						<span class="latestStatus">{{ instance.latestStatus || '-' }}</span>
						<span class="lastCommunicatedAt"><MkTime :time="instance.lastCommunicatedAt"/></span>
					</span>
				</div>
			</MkA>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.federation,
				icon: 'fas fa-globe'
			},
			host: '',
			state: 'federating',
			sort: '+pubSub',
			pagination: {
				endpoint: 'federation/instances',
				limit: 10,
				offsetMode: true,
				params: () => ({
					sort: this.sort,
					host: this.host != '' ? this.host : null,
					...(
						this.state === 'federating' ? { federating: true } :
						this.state === 'subscribing' ? { subscribing: true } :
						this.state === 'publishing' ? { publishing: true } :
						this.state === 'suspended' ? { suspended: true } :
						this.state === 'blocked' ? { blocked: true } :
						this.state === 'notResponding' ? { notResponding: true } :
						{})
				})
			},
		}
	},

	watch: {
		host() {
			this.$refs.instances.reload();
		},
		state() {
			this.$refs.instances.reload();
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		getStatus(instance) {
			if (instance.isSuspended) return 'suspended';
			if (instance.isNotResponding) return 'error';
			return 'alive';
		},
	}
});
</script>

<style lang="scss" scoped>
.taeiyria {
	> .query {
		background: var(--bg);
		padding: 16px;
		border-bottom: solid 0.5px var(--divider);
	}
}

.dqokceoi {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
	padding: 16px;

	> .instance {
		padding: 16px;
		border: solid 1px var(--divider);
		border-radius: 6px;

		&:hover {
			border: solid 1px var(--accent);
			text-decoration: none;
		}

		> .host {
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			> img {
				width: 18px;
				height: 18px;
				margin-right: 6px;
				vertical-align: middle;
			}
		}

		> .table {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
			grid-gap: 6px;
			margin: 6px 0;
			font-size: 70%;

			> .cell {
				> .key, > .value {
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				> .key {
					opacity: 0.7;
				}

				> .value {
				}
			}
		}

		> .footer {
			display: flex;
			align-items: center;

			> .status {
				&.suspended {
					opacity: 0.5;
				}

				&.error {
					color: var(--error);
				}

				&.alive {
					color: var(--success);
				}
			}

			> .pubSub {
				margin-left: 8px;
			}

			> .right {
				margin-left: auto;
				font-size: 0.9em;

				> .latestStatus {
					border: solid 1px var(--divider);
					border-radius: 4px;
					margin: 0 8px;
					padding: 0 4px;
				}
			}
		}
	}
}
</style>
