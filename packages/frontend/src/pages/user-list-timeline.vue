<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div ref="rootEl">
			<MkTimeline
				ref="tlEl" :key="listId"
				src="list"
				:list="listId"
				:sound="true"
				:class="$style.tl"
			/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const router = useRouter();

const props = defineProps<{
	listId: string;
}>();

let list = $ref(null);
let tlEl = $shallowRef<InstanceType<typeof MkTimeline>>();
let rootEl = $shallowRef<HTMLElement>();

watch(() => props.listId, async () => {
	list = await os.api('users/lists/show', {
		listId: props.listId,
	});
}, { immediate: true });

function top() {
	tlEl?.reload();
}

function settings() {
	router.push(`/my/lists/${props.listId}`);
}

async function timetravel() {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlEl.timetravel(date);
}

const headerActions = $computed(() => list ? [{
	icon: 'ti ti-calendar-time',
	text: i18n.ts.jumpToSpecifiedDate,
	handler: timetravel,
}, {
	icon: 'ti ti-settings',
	text: i18n.ts.settings,
	handler: settings,
}] : []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => list ? {
	title: list.name,
	icon: 'ti ti-list',
} : null));
</script>

<style lang="scss" module>

.tl {
	background: var(--bg);
	border-radius: var(--radius);
	overflow: clip;
}
</style>
