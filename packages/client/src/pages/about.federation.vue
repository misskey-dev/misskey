<template>
<div class="taeiyria">
	<div class="query">
		<MkInput v-model="host" :debounce="true" class="">
			<template #prefix><i class="fas fa-search"></i></template>
			<template #label>{{ i18n.ts.host }}</template>
		</MkInput>
		<FormSplit style="margin-top: var(--margin);">
			<MkSelect v-model="state">
				<template #label>{{ i18n.ts.state }}</template>
				<option value="all">{{ i18n.ts.all }}</option>
				<option value="federating">{{ i18n.ts.federating }}</option>
				<option value="subscribing">{{ i18n.ts.subscribing }}</option>
				<option value="publishing">{{ i18n.ts.publishing }}</option>
				<option value="suspended">{{ i18n.ts.suspended }}</option>
				<option value="blocked">{{ i18n.ts.blocked }}</option>
				<option value="notResponding">{{ i18n.ts.notResponding }}</option>
			</MkSelect>
			<MkSelect v-model="sort">
				<template #label>{{ i18n.ts.sort }}</template>
				<option value="+pubSub">{{ i18n.ts.pubSub }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-pubSub">{{ i18n.ts.pubSub }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+notes">{{ i18n.ts.notes }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-notes">{{ i18n.ts.notes }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+users">{{ i18n.ts.users }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-users">{{ i18n.ts.users }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+following">{{ i18n.ts.following }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-following">{{ i18n.ts.following }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+followers">{{ i18n.ts.followers }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-followers">{{ i18n.ts.followers }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+caughtAt">{{ i18n.ts.registeredAt }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-caughtAt">{{ i18n.ts.registeredAt }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+lastCommunicatedAt">{{ i18n.ts.lastCommunication }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-lastCommunicatedAt">{{ i18n.ts.lastCommunication }} ({{ i18n.ts.ascendingOrder }})</option>
			</MkSelect>
		</FormSplit>
	</div>

	<MkPagination v-slot="{items}" ref="instances" :key="host + state" :pagination="pagination">
		<div class="dqokceoi">
			<MkA v-for="instance in items" :key="instance.id" v-tooltip.mfm="`Last communicated: ${new Date(instance.lastCommunicatedAt).toLocaleString()}\nStatus: ${getStatus(instance)}`" class="instance" :to="`/instance-info/${instance.host}`">
				<MkInstanceCardMini :instance="instance"/>
			</MkA>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
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
			{}),
	})),
};

function getStatus(instance) {
	if (instance.isSuspended) return 'Suspended';
	if (instance.isBlocked) return 'Blocked';
	if (instance.isNotResponding) return 'Error';
	return 'Alive';
}
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

	> .instance:hover {
		text-decoration: none;
	}
}
</style>
