<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<MkPagePreview v-for="page in items" :key="page.id" :page="page" class="_gap"/>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkPagePreview from '@/components/page-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkPagePreview,
	},

	props: {
		user: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
			pagination: {
				endpoint: 'users/pages' as const,
				limit: 20,
				params: computed(() => ({
					userId: this.user.id,
				})),
			},
		};
	},
});
</script>

<style lang="scss" scoped>

</style>
