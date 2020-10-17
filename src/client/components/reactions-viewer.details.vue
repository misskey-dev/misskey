<template>
<MkTooltip :source="source" ref="tooltip" @closed="$emit('closed')">
	<div class="bqxuuuey">
		<div class="info">
			<div>{{ reaction.replace('@.', '') }}</div>
			<XReactionIcon :reaction="reaction" :custom-emojis="emojis" class="icon"/>
		</div>
		<template v-if="users.length <= 10">
			<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
				<MkAvatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/>
				<MkUserName :user="u" :nowrap="false" style="line-height: 24px;"/>
			</b>
		</template>
		<template v-if="10 < users.length">
			<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
				<MkAvatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/>
				<MkUserName :user="u" :nowrap="false" style="line-height: 24px;"/>
			</b>
			<span slot="omitted">+{{ count - 10 }}</span>
		</template>
	</div>
</MkTooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkTooltip from './ui/tooltip.vue';
import XReactionIcon from './reaction-icon.vue';

export default defineComponent({
	components: {
		MkTooltip,
		XReactionIcon
	},
	props: {
		reaction: {
			type: String,
			required: true,
		},
		users: {
			type: Array,
			required: true,
		},
		count: {
			type: Number,
			required: true,
		},
		emojis: {
			type: Array,
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
.bqxuuuey {
	> .info {
		padding: 0 0 8px 0;
		text-align: center;

		> .icon {
			display: block;
			width: 60px;
			height: 60px;
			margin: 0 auto;
		}
	}
}
</style>
