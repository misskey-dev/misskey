<template>
<mk-tooltip :source="source" ref="tooltip">
	<template v-if="users.length <= 10">
		<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
			<mk-avatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/>
			<mk-user-name :user="u" :nowrap="false" style="line-height: 24px;"/>
		</b>
	</template>
	<template v-if="10 < users.length">
		<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
			<mk-avatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/>
			<mk-user-name :user="u" :nowrap="false" style="line-height: 24px;"/>
		</b>
		<span slot="omitted">+{{ count - 10 }}</span>
	</template>
</mk-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import MkTooltip from './ui/tooltip.vue';

export default Vue.extend({
	components: {
		MkTooltip
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
		source: {
			required: true,
		}
	},

	methods: {
		close() {
			this.$refs.tooltip.close()
		}
	}
})
</script>
