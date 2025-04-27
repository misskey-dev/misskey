<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :pagination="featuredFlashsPagination">
				<div class="_gaps_s">
					<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'my'">
			<div class="_gaps">
				<MkButton gradate rounded style="margin: 0 auto;" @click="create()"><i class="ti ti-plus"></i></MkButton>
				<MkPagination v-slot="{items}" :pagination="myFlashsPagination">
					<div class="_gaps_s">
						<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
					</div>
				</MkPagination>
			</div>
		</div>

		<div v-else-if="tab === 'liked'">
			<MkPagination v-slot="{items}" :pagination="likedFlashsPagination">
				<div class="_gaps_s">
					<MkFlashPreview v-for="like in items" :key="like.flash.id" :flash="like.flash"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkFlashPreview from '@/components/MkFlashPreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const tab = ref('featured');

const featuredFlashsPagination = {
	endpoint: 'flash/featured' as const,
	limit: 5,
	offsetMode: true,
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

definePage(() => ({
	title: 'Play',
	icon: 'ti ti-player-play',
}));
</script>
