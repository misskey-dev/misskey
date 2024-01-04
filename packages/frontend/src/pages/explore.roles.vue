<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="700">
	<div class="_gaps_s">
		<MkRolePreview v-for="role in roles" :key="role.id" :role="role" :forModeration="false"/>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os.js';

const roles = ref();

os.api('roles/list').then(res => {
	roles.value = res.filter(x => x.target === 'manual').sort((a, b) => b.displayOrder - a.displayOrder);
});
</script>

