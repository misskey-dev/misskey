<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="1200">
	<MkFoldableSection class="_margin" persistKey="explore-pinned-users">
		<template #header><i class="ti ti-bookmark ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedUsers }}</template>
		<MkUserList :pagination="pinnedUsers"/>
	</MkFoldableSection>
	<MkFoldableSection class="_margin" persistKey="explore-popular-users">
		<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularUsers }}</template>
		<MkUserList :pagination="popularUsers"/>
	</MkFoldableSection>
</MkSpacer>
</template>

<script lang="ts" setup>
import MkUserList from '@/components/MkUserList.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { i18n } from '@/i18n.js';

const pinnedUsers = { endpoint: 'pinned-users', noPaging: true };
const popularUsers = { endpoint: 'users', limit: 30, noPaging: true, params: {
	state: 'alive',
	origin: 'local',
	sort: '+pv',
} };
</script>
