<template>
<MkSpacer :content-max="1000">
	<div class="taeiyria">
		<div class="query">
			<MkInput v-model="host" :debounce="true" class="">
				<template #prefix><i class="fas fa-search"></i></template>
				<template #label>{{ $ts.host }}</template>
			</MkInput>
			<FormSplit style="margin-top: var(--margin);">
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
					<option value="+caughtAt">{{ $ts.registeredAt }} ({{ $ts.descendingOrder }})</option>
					<option value="-caughtAt">{{ $ts.registeredAt }} ({{ $ts.ascendingOrder }})</option>
					<option value="+lastCommunicatedAt">{{ $ts.lastCommunication }} ({{ $ts.descendingOrder }})</option>
					<option value="-lastCommunicatedAt">{{ $ts.lastCommunication }} ({{ $ts.ascendingOrder }})</option>
				</MkSelect>
			</FormSplit>
		</div>

		<MkPagination v-slot="{items}" ref="instances" :key="host + state" :pagination="pagination">
			<div class="dqokceoi">
				<MkA v-for="instance in items" :key="instance.id" class="instance" :to="`/instance-info/${instance.host}`">
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
							<span v-if="instance.followersCount > 0" class="sub"><i class="fas fa-caret-down icon"></i>Sub</span>
							<span v-else class="sub"><i class="fas fa-caret-down icon"></i>-</span>
							<span v-if="instance.followingCount > 0" class="pub"><i class="fas fa-caret-up icon"></i>Pub</span>
							<span v-else class="pub"><i class="fas fa-caret-up icon"></i>-</span>
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
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

let host = $ref('');
let state = $ref('federating');
let sort = $ref('+pubSub');
const pagination = {
	endpoint: 'federation/instances' as const,
	limit: 10,
	offsetMode: true,
	params: computed(() => ({
		sort: sort,
		host: host !== '' ? host : null,
		...(
			state === 'federating' ? { federating: true } :
			state === 'subscribing' ? { subscribing: true } :
			state === 'publishing' ? { publishing: true } :
			state === 'suspended' ? { suspended: true } :
			state === 'blocked' ? { blocked: true } :
			state === 'notResponding' ? { notResponding: true } :
			{})
	}))
};

function getStatus(instance) {
	if (instance.isSuspended) return 'suspended';
	if (instance.isNotResponding) return 'error';
	return 'alive';
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.federation,
		icon: 'fas fa-globe',
		bg: 'var(--bg)',
	},
});
</script>

<style lang="scss" scoped>
.taeiyria {
	> .query {
		background: var(--bg);
		margin-bottom: 16px;
	}
}

.dqokceoi {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;

	> .instance {
		padding: 16px;
		background: var(--panel);
		border-radius: 8px;

		&:hover {
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
			font-size: 0.9em;

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
