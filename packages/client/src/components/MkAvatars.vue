<template>
<div>
	<div v-for="user in users" :key="user.id" style="display:inline-block;width:32px;height:32px;margin-right:8px;">
		<MkAvatar :user="user" style="width:32px;height:32px;" :show-indicator="true"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as os from '@/os';

const props = defineProps<{
	userIds: string[];
}>();

const users = ref([]);

onMounted(async () => {
	users.value = await os.api('users/show', {
		userIds: props.userIds
	});
});
</script>
