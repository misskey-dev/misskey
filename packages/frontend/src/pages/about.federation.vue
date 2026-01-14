<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div>
		<MkInput v-model="host" :debounce="true" class="">
			<template #prefix><i class="ti ti-search"></i></template>
			<template #label>{{ i18n.ts.host }}</template>
		</MkInput>
		<FormSplit style="margin-top: var(--MI-margin);">
			<MkSelect v-model="state" :items="stateDef">
				<template #label>{{ i18n.ts.state }}</template>
			</MkSelect>
			<MkSelect v-model="sort" :items="sortDef">
				<template #label>{{ i18n.ts.sort }}</template>
			</MkSelect>
		</FormSplit>
	</div>

	<MkPagination v-slot="{items}" ref="instances" :key="host + state" :paginator="paginator">
		<div :class="$style.items">
			<MkA v-for="instance in items" :key="instance.id" v-tooltip.mfm="`Status: ${getStatus(instance)}`" :class="$style.item" :to="`/instance-info/${instance.host}`">
				<MkInstanceCardMini :instance="instance"/>
			</MkA>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';
import FormSplit from '@/components/form/split.vue';
import { i18n } from '@/i18n.js';
import { useMkSelect } from '@/composables/use-mkselect.js';
import { Paginator } from '@/utility/paginator.js';

const host = ref('');
const {
	model: state,
	def: stateDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts.all, value: 'all' },
		{ label: i18n.ts.federating, value: 'federating' },
		{ label: i18n.ts.subscribing, value: 'subscribing' },
		{ label: i18n.ts.publishing, value: 'publishing' },
		{ label: i18n.ts.suspended, value: 'suspended' },
		{ label: i18n.ts.silence, value: 'silenced' },
		{ label: i18n.ts.blocked, value: 'blocked' },
		{ label: i18n.ts.notResponding, value: 'notResponding' },
	],
	initialValue: 'federating',
});
const {
	model: sort,
	def: sortDef,
} = useMkSelect({
	items: [
		{ label: `${i18n.ts.pubSub} (${i18n.ts.descendingOrder})`, value: '+pubSub' },
		{ label: `${i18n.ts.pubSub} (${i18n.ts.ascendingOrder})`, value: '-pubSub' },
		{ label: `${i18n.ts.notes} (${i18n.ts.descendingOrder})`, value: '+notes' },
		{ label: `${i18n.ts.notes} (${i18n.ts.ascendingOrder})`, value: '-notes' },
		{ label: `${i18n.ts.users} (${i18n.ts.descendingOrder})`, value: '+users' },
		{ label: `${i18n.ts.users} (${i18n.ts.ascendingOrder})`, value: '-users' },
		{ label: `${i18n.ts.following} (${i18n.ts.descendingOrder})`, value: '+following' },
		{ label: `${i18n.ts.following} (${i18n.ts.ascendingOrder})`, value: '-following' },
		{ label: `${i18n.ts.followers} (${i18n.ts.descendingOrder})`, value: '+followers' },
		{ label: `${i18n.ts.followers} (${i18n.ts.ascendingOrder})`, value: '-followers' },
		{ label: `${i18n.ts.registeredAt} (${i18n.ts.descendingOrder})`, value: '+firstRetrievedAt' },
		{ label: `${i18n.ts.registeredAt} (${i18n.ts.ascendingOrder})`, value: '-firstRetrievedAt' },
	],
	initialValue: '+pubSub',
});
const paginator = markRaw(new Paginator('federation/instances', {
	limit: 10,
	offsetMode: true,
	computedParams: computed(() => ({
		sort: sort.value,
		host: host.value !== '' ? host.value : null,
		...(
			state.value === 'federating' ? { federating: true, suspended: false, blocked: false } :
			state.value === 'subscribing' ? { subscribing: true, suspended: false, blocked: false } :
			state.value === 'publishing' ? { publishing: true, suspended: false, blocked: false } :
			state.value === 'suspended' ? { suspended: true } :
			state.value === 'blocked' ? { blocked: true } :
			state.value === 'silenced' ? { silenced: true } :
			state.value === 'notResponding' ? { notResponding: true } :
			{}),
	})),
}));

function getStatus(instance: Misskey.entities.FederationInstance) {
	if (instance.isSuspended) return 'Suspended';
	if (instance.isBlocked) return 'Blocked';
	if (instance.isSilenced) return 'Silenced';
	if (instance.isNotResponding) return 'Error';
	return 'Alive';
}
</script>

<style lang="scss" module>
.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
}

.item:hover {
	text-decoration: none;
}
</style>
