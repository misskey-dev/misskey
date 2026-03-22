<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div>
			<MkResult v-if="antennas.length === 0" type="empty"/>

			<MkButton :link="true" to="/my/antennas/create" primary :class="$style.add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

			<div v-if="antennas.length > 0" class="_gaps">
				<MkA v-for="antenna in antennas" :key="antenna.id" :class="$style.antenna" :to="`/timeline/antenna/${antenna.id}`">
					<div class="name">{{ antenna.name }}</div>
				</MkA>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { antennasCache } from '@/cache.js';

const antennas = computed(() => antennasCache.value.value ?? []);

function _fetch_() {
	antennasCache.fetch();
}

_fetch_();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: i18n.ts.reload,
	handler: () => {
		antennasCache.delete();
		_fetch_();
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.manageAntennas,
	icon: 'ti ti-antenna',
}));

onActivated(() => {
	antennasCache.fetch();
});
</script>

<style lang="scss" module>
.add {
	margin: 0 auto 16px auto;
}

.antenna {
	display: block;
	padding: 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;

	&:hover {
		border: solid 1px var(--MI_THEME-accent);
		text-decoration: none;
	}
}

.name {
	font-weight: bold;
}
</style>
