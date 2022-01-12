<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="type === 'following' ? followingPagination : followersPagination" class="mk-following-or-followers">
		<div class="users _isolated">
			<MkUserInfo v-for="user in items.map(x => type === 'following' ? x.followee : x.follower)" :key="user.id" class="user" :user="user"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkUserInfo from '@/components/user-info.vue';
import MkPagination from '@/components/ui/pagination.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkUserInfo,
	},

	props: {
		user: {
			type: Object,
			required: true
		},
		type: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			followingPagination: {
				endpoint: 'users/following' as const,
				limit: 20,
				params: computed(() => ({
					userId: this.user.id,
				})),
			},
			followersPagination: {
				endpoint: 'users/followers' as const,
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
.mk-following-or-followers {
	> .users {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}
}
</style>
