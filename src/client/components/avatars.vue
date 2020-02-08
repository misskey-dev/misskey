<template>
<div>
	<div v-for="user in us" :key="user.id" style="display:inline-block;width:32px;height:32px;margin-right:8px;">
		<mk-avatar :user="user" style="width:32px;height:32px;"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		userIds: {
			required: true
		},
	},
	data() {
		return {
			us: []
		};
	},
	async created() {
		this.us = await this.$root.api('users/show', {
			userIds: this.userIds
		});
	}
});
</script>
