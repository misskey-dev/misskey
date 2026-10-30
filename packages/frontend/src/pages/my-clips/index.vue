<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer _gaps" style="--MI_SPACER-w: 700px;">
		<MkTip k="clips">
			{{ i18n.ts._clip.tip }}
		</MkTip>
		<div v-if="tab === 'my'" class="_gaps">
			<MkButton primary rounded class="add" @click="create"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

			<MkPagination v-slot="{ items }" :paginator="paginator" class="_gaps" withControl>
				<MkClipPreview v-for="item in items" :key="item.id" :clip="item" :noUserInfo="true"/>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'favorites'">
			<MkPagination v-slot="{ items }" :paginator="favoritesPaginator" class="_gaps" withControl>
				<MkClipPreview v-for="item in items" :key="item.id" :clip="item" :noUserInfo="true"/>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkClipPreview from '@/components/MkClipPreview.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { clipsCache } from '@/cache.js';
import { Paginator } from '@/utility/paginator.js';

const tab = ref('my');

const paginator = markRaw(new Paginator('clips/list', {
}));

const favoritesPaginator = markRaw(new Paginator('clips/my-favorites', {
	// ページネーションに対応していない
	noPaging: true,
}));

async function create() {
	const { canceled, result } = await os.form(i18n.ts.createNewClip, {
		name: {
			type: 'string',
			label: i18n.ts.name,
		},
		description: {
			type: 'string',
			required: false,
			multiline: true,
			treatAsMfm: true,
			label: i18n.ts.description,
		},
		isPublic: {
			type: 'boolean',
			label: i18n.ts.public,
			default: false,
		},
	});

	if (canceled) return;

	os.apiWithDialog('clips/create', result);

	clipsCache.delete();

	paginator.reload();
}

function onClipCreated() {
	paginator.reload();
}

function onClipDeleted() {
	paginator.reload();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'my',
	title: i18n.ts.myClips,
	icon: 'ti ti-paperclip',
}, {
	key: 'favorites',
	title: i18n.ts.favorites,
	icon: 'ti ti-heart',
}]);

definePage(() => ({
	title: i18n.ts.clip,
	icon: 'ti ti-paperclip',
}));
</script>

<style lang="scss" module>

</style>
