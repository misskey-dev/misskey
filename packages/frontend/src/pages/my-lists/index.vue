<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div class="qkcjvfiv">
			<MkButton primary class="add" @click="create"><i class="ti ti-plus"></i> {{ i18n.ts.createList }}</MkButton>

			<MkPagination v-slot="{items}" ref="pagingComponent" :pagination="pagination" class="lists">
				<MkA v-for="list in items" :key="list.id" class="list _panel" :to="`/my/lists/${ list.id }`">
					<div class="name">{{ list.name }}</div>
					<MkAvatars :user-ids="list.userIds"/>
				</MkA>
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

<style lang="scss" scoped>
.qkcjvfiv {
	> .add {
		margin: 0 auto var(--margin) auto;
	}

	> .lists {
		> .list {
			display: block;
			padding: 16px;
			border: solid 1px var(--divider);
			border-radius: 6px;

			&:hover {
				border: solid 1px var(--accent);
				text-decoration: none;
			}

			> .name {
				margin-bottom: 4px;
			}
		}
	}
}
</style>
