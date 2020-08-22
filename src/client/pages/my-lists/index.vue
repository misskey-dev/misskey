<template>
<div class="qkcjvfiv">
	<teleport to="#_teleport_header"><fa :icon="faListUl"/>{{ $t('manageLists') }}</teleport>

	<mk-button @click="create" primary class="add"><fa :icon="faPlus"/> {{ $t('createList') }}</mk-button>

	<mk-pagination :pagination="pagination" #default="{items}" class="lists" ref="list">
		<div class="list _panel" v-for="(list, i) in items" :key="list.id">
			<router-link :to="`/my/lists/${ list.id }`">{{ list.name }}</router-link>
		</div>
	</mk-pagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faListUl, faPlus } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../../components/ui/pagination.vue';
import MkButton from '../../components/ui/button.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('manageLists') as string,
		};
	},

	components: {
		MkPagination,
		MkButton,
	},

	data() {
		return {
			pagination: {
				endpoint: 'users/lists/list',
				limit: 10,
			},
			faListUl, faPlus
		};
	},

	methods: {
		async create() {
			const { canceled, result: name } = await this.$root.dialog({
				title: this.$t('enterListName'),
				input: true
			});
			if (canceled) return;
			await this.$root.api('users/lists/create', { name: name });
			this.$refs.list.reload();
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.qkcjvfiv {
	> .add {
		margin: 0 auto var(--margin) auto;
	}

	> .lists {
		> .list {
			display: flex;
			padding: 16px;
		}
	}
}
</style>
