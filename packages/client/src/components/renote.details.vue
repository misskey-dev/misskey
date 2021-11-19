<template>
<MkTooltip ref="tooltip" :source="source" :max-width="250" @closed="$emit('closed')">
	<div class="beaffaef">
		<div v-for="u in users" :key="u.id" class="user">
			<MkAvatar class="avatar" :user="u"/>
			<MkUserName class="name" :user="u" :nowrap="true"/>
		</div>
		<div v-if="users.length < count" class="omitted">+{{ count - users.length }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkTooltip from './ui/tooltip.vue';

export default defineComponent({
	components: {
		MkTooltip,
	},
	props: {
		users: {
			type: Array,
			required: true,
		},
		count: {
			type: Number,
			required: true,
		},
		source: {
			required: true,
		}
	},
	emits: ['closed'],
})
</script>

<style lang="scss" scoped>
.beaffaef {
	font-size: 0.9em;
	text-align: left;

	> .user {
		line-height: 24px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		&:not(:last-child) {
			margin-bottom: 3px;
		}

		> .avatar {
			width: 24px;
			height: 24px;
			margin-right: 3px;
		}
	}
}
</style>
