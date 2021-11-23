<template>
<div>
	<MkPagination #default="{items}" ref="list" :pagination="pagination">
		<div v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _gap afdcfbfb">
			<div class="header">
				<MkAvatar class="avatar" :user="user"/>
				<MkReactionIcon class="reaction" :reaction="item.type" :custom-emojis="item.note.emojis" :no-style="true"/>
				<MkTime :time="item.createdAt" class="createdAt"/>
			</div>
			<MkNote :key="item.id" :note="item.note" @update:note="updated(note, $event)"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkNote from '@/components/note.vue';
import MkReactionIcon from '@/components/reaction-icon.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkNote,
		MkReactionIcon,
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
				endpoint: 'users/reactions',
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
});
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
