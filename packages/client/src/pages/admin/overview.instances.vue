<template>
<div class="wbrkwale">
	<MkLoading v-if="fetching"/>
	<div v-else class="instances">
		<MkA v-for="(instance, i) in instances" :key="instance.id" :to="`/instance-info/${instance.host}`" class="instance">
			<MkInstanceCardMini :instance="instance"/>
		</MkA>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';

const instances = ref([]);
const fetching = ref(true);

const fetch = async () => {
	const fetchedInstances = await os.api('federation/instances', {
		sort: '+lastCommunicatedAt',
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

<style lang="scss" scoped>
.wbrkwale {
	> .instances {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		grid-gap: 12px;

		> .instance:hover {
			text-decoration: none;
		}
	}
}
</style>
