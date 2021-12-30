<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<MkPagePreview v-for="page in items" :key="page.id" :page="page" class="_gap"/>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
				endpoint: 'users/pages',
				limit: 20,
				params: {
					userId: this.user.id,
				}
			},
		};
	},

	watch: {
		user() {
			this.$refs.list.reload();
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
