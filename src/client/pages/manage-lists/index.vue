<template>
<x-pagination :pagination="pagination" #default="{items}" class="mk-user-lists">
	<div class="list _panel" v-for="(list, i) in items" :key="list.id" :data-index="i">
		<router-link :to="`/manage-lists/${ list.id }`">{{ list.name }}</router-link>
	</div>
</x-pagination>
</template>

<script lang="ts">
import Vue from 'vue';
import XPagination from '../../components/ui/pagination.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('manageLists') as string,
		};
	},

	components: {
		XPagination
	},

	data() {
		return {
			pagination: {
				endpoint: 'users/lists/list',
				limit: 10,
			},
		};
	},
});
</script>

<style lang="scss" scoped>
@import '../../theme';

.mk-user-lists {
	> .list {
		display: flex;
		padding: 16px;
	}
}
</style>
