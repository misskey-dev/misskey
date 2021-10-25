<template>
<div class="qkcjvfiv">
	<MkButton @click="create" primary class="add"><i class="fas fa-plus"></i> {{ $ts.createList }}</MkButton>

	<MkPagination :pagination="pagination" #default="{items}" class="lists _content" ref="list">
		<MkA v-for="list in items" :key="list.id" class="list _panel" :to="`/my/lists/${ list.id }`">
			<div class="name">{{ list.name }}</div>
			<MkAvatars :user-ids="list.userIds"/>
		</MkA>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkButton from '@client/components/ui/button.vue';
import MkAvatars from '@client/components/avatars.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
		MkAvatars,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.manageLists,
				icon: 'fas fa-list-ul',
				bg: 'var(--bg)',
				action: {
					icon: 'fas fa-plus',
					handler: this.create
				},
			},
			pagination: {
				endpoint: 'users/lists/list',
				limit: 10,
			},
		};
	},

	methods: {
		async create() {
			const { canceled, result: name } = await os.dialog({
				title: this.$ts.enterListName,
				input: true
			});
			if (canceled) return;
			await os.api('users/lists/create', { name: name });
			this.$refs.list.reload();
			os.success();
		},
	}
});
</script>

<style lang="scss" scoped>
.qkcjvfiv {
	padding: 16px;

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
