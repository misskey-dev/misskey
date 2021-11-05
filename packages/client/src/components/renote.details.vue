<template>
<MkTooltip :source="source" ref="tooltip" @closed="$emit('closed')" :max-width="340">
	<div class="renoteTooltip">
		<template v-if="users.length <= 10">
			<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
				<MkAvatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/><br/>
				<MkUserName :user="u" :nowrap="false" style="line-height: 24px;"/>
			</b>
		</template>
		<template v-if="10 < users.length">
			<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
				<MkAvatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/><br/>
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
.renoteTooltip {
	display: flex;
	flex: 1;
	min-width: 0;
	font-size: 0.9em;
	border-left: solid 0.5px var(--divider);
	padding-left: 10px;
    margin-left: 10px;
}
</style>
