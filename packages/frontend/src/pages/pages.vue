<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :paginator="featuredPagesPaginator">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'my'" class="_gaps">
			<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :paginator="myPagesPaginator">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'liked'">
			<MkPagination v-slot="{items}" :paginator="likedPagesPaginator">
				<div class="_gaps">
					<MkPagePreview v-for="like in items" :key="like.page.id" :page="like.page"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { Paginator } from '@/utility/paginator.js';

const router = useRouter();

const tab = ref('featured');

const featuredPagesPaginator = markRaw(new Paginator('pages/featured', {
	noPaging: true,
}));
const myPagesPaginator = markRaw(new Paginator('i/pages', {
	limit: 5,
}));
const likedPagesPaginator = markRaw(new Paginator('i/page-likes', {
	limit: 5,
}));

function create() {
	router.push('/pages/new');
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
	key: 'featured',
	title: i18n.ts._pages.featured,
	icon: 'ti ti-flare',
}, {
	key: 'my',
	title: i18n.ts._pages.my,
	icon: 'ti ti-edit',
}, {
	key: 'liked',
	title: i18n.ts._pages.liked,
	icon: 'ti ti-heart',
}]);

definePage(() => ({
	title: i18n.ts.pages,
	icon: 'ti ti-note',
}));
</script>
