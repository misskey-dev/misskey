<template>
<div>
	<div v-for="user in us" :key="user.id" style="display:inline-block;width:32px;height:32px;margin-right:8px;">
		<MkAvatar :user="user" style="width:32px;height:32px;" :show-indicator="true"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
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
		this.us = await os.api('users/show', {
			userIds: this.userIds
		});
	}
});
</script>
