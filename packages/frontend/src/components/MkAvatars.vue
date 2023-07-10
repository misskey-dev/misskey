<template>
<div>
	<div v-for="user in users.slice(0, limit)" :key="user" style="display:inline-block;width:32px;height:32px;margin-right:8px;">
		<MkAvatar :user="user" style="width:32px; height:32px;" indicator link preview/>
	</div>
	<div v-if="users.length > limit" style="display: inline-block;">...</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as os from '@/os';

const props = withDefaults(defineProps<{
	userIds: string[];
	limit?: number;
}>(), {
	limit: Infinity,
});

const users = ref([]);

onMounted(async () => {
	users.value = await os.api('users/show', {
		userIds: props.userIds,
	});
});
</script>
