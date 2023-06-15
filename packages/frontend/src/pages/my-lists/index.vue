<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<div class="_gaps">
			<MkButton primary rounded style="margin: 0 auto;" @click="create"><i class="ti ti-plus"></i> {{ i18n.ts.createList }}</MkButton>

			<MkPagination v-slot="{items}" ref="pagingComponent" :pagination="pagination">
				<div class="_gaps">
					<MkA v-for="list in items" :key="list.id" class="_panel" :class="$style.list" :to="`/my/lists/${ list.id }`">
						<div style="margin-bottom: 4px;">{{ list.name }}</div>
						<MkAvatars :userIds="list.userIds"/>
					</MkA>
				</div>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkAvatars from '@/components/MkAvatars.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { userListsCache } from '@/cache';

const pagingComponent = $shallowRef<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: 'users/lists/list' as const,
	noPaging: true,
	limit: 10,
};

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled) return;
	await os.apiWithDialog('users/lists/create', { name: name });
	userListsCache.delete();
	pagingComponent.reload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.manageLists,
	icon: 'ti ti-list',
	action: {
		icon: 'ti ti-plus',
		handler: create,
	},
});
</script>

<style lang="scss" module>
.list {
	display: block;
	padding: 16px;
	border: solid 1px var(--divider);
	border-radius: 6px;
	margin-bottom: 8px;

	&:hover {
		border: solid 1px var(--accent);
		text-decoration: none;
	}
}
</style>
