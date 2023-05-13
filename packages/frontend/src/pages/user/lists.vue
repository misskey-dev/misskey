<template>
<MkStickyContainer>
	<MkSpacer :content-max="700">
		<div class="xmbcjiokr">
			<MkPagination v-slot="{items}" ref="pagingComponent" :pagination="pagination" class="lists">
				<MkA v-for="list in items" :key="list.id" class="list _panel" :to="`/list/${ list.id }`">
					<div class="name">{{ list.name }}</div>
					<MkAvatars :user-ids="list.userIds"/>
				</MkA>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from 'vue';
import * as misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkStickyContainer from '@/components/global/MkStickyContainer.vue';
import MkSpacer from '@/components/global/MkSpacer.vue';
import MkAvatars from '@/components/MkAvatars.vue';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

const pagination = {
	endpoint: 'users/lists/list' as const,
	noPaging: true,
	limit: 10,
	params: {
		userId: props.user.id,
	},
};
</script>
<style lang="scss" scoped>
.xmbcjiokr {
	> .lists {
		> .list {
			display: block;
			padding: 16px;
			border: solid 1px var(--divider);
			border-radius: 6px;
			margin-bottom: 8px;

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
