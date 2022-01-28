<template>
<MkSpacer :content-max="700">
	<div class="qkcjvfiv">
		<MkButton primary class="add" @click="create"><i class="fas fa-plus"></i> {{ $ts.createList }}</MkButton>

		<MkPagination v-slot="{items}" ref="pagingComponent" :pagination="pagination" class="lists _content">
			<MkA v-for="list in items" :key="list.id" class="list _panel" :to="`/my/lists/${ list.id }`">
				<div class="name">{{ list.name }}</div>
				<MkAvatars :user-ids="list.userIds"/>
			</MkA>
		</MkPagination>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import MkAvatars from '@/components/avatars.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagingComponent = $ref<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: 'users/lists/list' as const,
	limit: 10,
};

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled) return;
	await os.apiWithDialog('users/lists/create', { name: name });
	pagingComponent.reload();
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.manageLists,
		icon: 'fas fa-list-ul',
		bg: 'var(--bg)',
		action: {
			icon: 'fas fa-plus',
			handler: create,
		},
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
