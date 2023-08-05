<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<div>
			<div v-if="antennas.length === 0" class="empty">
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.nothing }}</div>
				</div>
			</div>

			<MkButton :link="true" to="/my/antennas/create" primary :class="$style.add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

			<div v-if="antennas.length > 0" class="_gaps">
				<MkA v-for="antenna in antennas" :key="antenna.id" :class="$style.antenna" :to="`/my/antennas/${antenna.id}`">
					<div class="name">{{ antenna.name }}</div>
				</MkA>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { antennasCache } from '@/cache';
import { api } from '@/os';
import { onActivated } from 'vue';
import { infoImageUrl } from '@/instance';

const antennas = $computed(() => antennasCache.value.value ?? []);

function fetch() {
	antennasCache.fetch(() => api('antennas/list'));
}

fetch();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: i18n.ts.reload,
	handler: () => {
		antennasCache.delete();
		fetch();
	},
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'ti ti-antenna',
});

onActivated(() => {
	antennasCache.fetch(() => api('antennas/list'));
});
</script>

<style lang="scss" module>
.add {
	margin: 0 auto 16px auto;
}

.antenna {
	display: block;
	padding: 16px;
	border: solid 1px var(--divider);
	border-radius: 6px;

	&:hover {
		border: solid 1px var(--accent);
		text-decoration: none;
	}
}

.name {
	font-weight: bold;
}
</style>
