<template>
<MkSpacer>
	<div :class="$style.roleGrid">
		<MkRolePreview v-for="role in roles" :key="role.id" :role="role" :forModeration="false"/>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os';

let roles = $ref();

os.api('roles/list').then(res => {
	roles = res.filter(x => x.target === 'manual').sort((a, b) => b.displayOrder - a.displayOrder);
});
</script>

<style lang="scss" module>
	.roleGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}
</style>

