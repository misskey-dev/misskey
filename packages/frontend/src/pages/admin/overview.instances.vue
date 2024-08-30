<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" mode="out-in">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.instances">
			<MkA v-for="(instance, i) in instances" :key="instance.id" v-tooltip.mfm.noDelay="`${instance.name}\n${instance.host}\n${instance.softwareName} ${instance.softwareVersion}`" :to="`/instance-info/${instance.host}`" :class="$style.instance">
				<MkInstanceCardMini :instance="instance"/>
			</MkA>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';
import { defaultStore } from '@/store.js';

const instances = ref<Misskey.entities.FederationInstance[]>([]);
const fetching = ref(true);

const fetch = async () => {
	const fetchedInstances = await misskeyApi('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 6,
	});
	instances.value = fetchedInstances;
	fetching.value = false;
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});
</script>

<style lang="scss" module>
.instances {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	grid-gap: 12px;
}

.instance:hover {
	text-decoration: none;
}
</style>
