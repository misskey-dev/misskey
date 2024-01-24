<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<div class="_gaps">
			<div class="_panel">
				<MkA to="/bubble-game">
					<img src="/client-assets/drop-and-fusion/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
				</MkA>
			</div>
			<div class="_panel">
				<MkA to="/reversi">
					<img src="/client-assets/reversi/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
				</MkA>
			</div>
		</div>
		<MkPagination v-slot="{items}" :pagination="featuredPagination">
			<MkChannelPreview v-for="channel in items" :key="channel.id" class="_margin" :channel="channel"/>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkPagination from '@/components/MkPagination.vue';
import MkChannelPreview from '@/components/MkChannelPreview.vue';

definePageMetadata({
	title: 'Misskey Games',
	icon: 'ti ti-device-gamepad',
});

const featuredPagination = {
	endpoint: 'channels/featured-games' as const,
	noPaging: true,
};
</script>
