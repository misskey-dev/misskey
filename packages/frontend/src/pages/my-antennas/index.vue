<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkButton type="routerLink" to="/my/antennas/create" primary :class="$style.add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

			<MkResult v-if="antennas.length === 0 && favorited.length === 0" type="empty"/>

			<div v-if="antennas.length > 0" class="_gaps">
				<MkA v-for="antenna in antennas" :key="antenna.id" :class="$style.antenna" :to="`/timeline/antenna/${antenna.id}`">
					<div :class="$style.name">
						<span>{{ antenna.name }}</span>
						<span v-if="antenna.isPublic" :class="$style.badge"><i class="ti ti-world"></i> {{ i18n.ts.public }}</span>
					</div>
				</MkA>
			</div>

			<template v-if="favorited.length > 0">
				<div :class="$style.sectionTitle">{{ i18n.ts._antenna.favoritedPublicAntennas }}</div>
				<div class="_gaps">
					<MkA v-for="antenna in favorited" :key="antenna.id" :class="$style.antenna" :to="`/timeline/antenna/${antenna.id}`">
						<div :class="$style.name">{{ antenna.name }}</div>
						<div :class="$style.byUser">@{{ antenna.user.username }}</div>
					</MkA>
				</div>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { antennasCache, favoritedAntennasCache } from '@/cache.js';

const antennas = computed(() => antennasCache.value.value ?? []);
const favorited = computed(() => favoritedAntennasCache.value.value ?? []);

function _fetch_() {
	antennasCache.fetch();
	favoritedAntennasCache.fetch();
}

_fetch_();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: i18n.ts.reload,
	handler: () => {
		antennasCache.delete();
		favoritedAntennasCache.delete();
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
	favoritedAntennasCache.fetch();
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
	display: flex;
	align-items: center;
	gap: 8px;
}

.badge {
	font-size: 0.85em;
	font-weight: normal;
	padding: 2px 6px;
	border-radius: 4px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.byUser {
	margin-top: 4px;
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: 0.85em;
}

.sectionTitle {
	margin-top: 8px;
	font-weight: bold;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
