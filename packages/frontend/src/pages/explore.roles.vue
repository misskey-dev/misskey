<template>
<MkSpacer :content-max="1200">
	<div class="_gaps_s">
		<MkRolePreview v-for="role in roles" :key="role.id" :role="role" :for-moderation="false"/>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os';

let roles = $ref();

os.api('roles/list', {
	limit: 30,
}).then(res => {
	roles = res.filter(x => x.target === 'manual');
});
</script>

