<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<div v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _gap afdcfbfb">
			<div class="header">
				<MkAvatar class="avatar" :user="user"/>
				<MkReactionIcon class="reaction" :reaction="item.type" :custom-emojis="item.note.emojis" :no-style="true"/>
				<MkTime :time="item.createdAt" class="createdAt"/>
			</div>
			<MkNote :key="item.id" :note="item.note"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';

const props = defineProps<{
	user: misskey.entities.User;
}>();

const pagination = {
	endpoint: 'users/reactions' as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" scoped>
.afdcfbfb {
	> .header {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		margin-bottom: 8px;
		border-bottom: solid 2px var(--divider);

		> .avatar {
			width: 24px;
			height: 24px;
			margin-right: 8px;
		}

		> .reaction {
			width: 32px;
			height: 32px;
		}

		> .createdAt {
			margin-left: auto;
		}
	}
}
</style>
