<template>
<div>
	<MkPagination :pagination="pagination" #default="{items}" ref="list">
		<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _vMargin">
			<b>{{ item.name }}</b>
			<div v-if="item.description" class="description">{{ item.description }}</div>
		</MkA>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import { userPage, acct } from '../../filters/user';

export default defineComponent({
	components: {
		MkPagination,
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
				endpoint: 'users/clips',
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
	},

	methods: {
		userPage,
		
		acct
	}
});
</script>

<style lang="scss" scoped>

</style>
