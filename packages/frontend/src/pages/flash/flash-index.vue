<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div v-if="tab === 'featured'" key="featured">
				<MkPagination v-slot="{items}" :pagination="featuredFlashsPagination">
					<div class="_gaps_s">
						<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
					</div>
				</MkPagination>
			</div>

			<div v-else-if="tab === 'my'" key="my">
				<div class="_gaps">
					<MkButton gradate rounded style="margin: 0 auto;" @click="create()"><i class="ti ti-plus"></i></MkButton>
					<MkPagination v-slot="{items}" :pagination="myFlashsPagination">
						<div class="_gaps_s">
							<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
						</div>
					</MkPagination>
				</div>
			</div>

			<div v-else-if="tab === 'liked'" key="liked">
				<MkPagination v-slot="{items}" :pagination="likedFlashsPagination">
					<div class="_gaps_s">
						<MkFlashPreview v-for="like in items" :key="like.flash.id" :flash="like.flash"/>
					</div>
				</MkPagination>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkFlashPreview from '@/components/MkFlashPreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const tab = ref('featured');

const featuredFlashsPagination = {
	endpoint: 'flash/featured' as const,
	noPaging: true,
};
const myFlashsPagination = {
	endpoint: 'flash/my' as const,
	limit: 5,
};
const likedFlashsPagination = {
	endpoint: 'flash/my-likes' as const,
	limit: 5,
};

function create() {
	router.push('/play/new');
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
	key: 'featured',
	title: i18n.ts._play.featured,
	icon: 'ti ti-flare',
}, {
	key: 'my',
	title: i18n.ts._play.my,
	icon: 'ti ti-edit',
}, {
	key: 'liked',
	title: i18n.ts._play.liked,
	icon: 'ti ti-heart',
}]);

definePageMetadata(() => ({
	title: 'Play',
	icon: 'ti ti-player-play',
}));
</script>
