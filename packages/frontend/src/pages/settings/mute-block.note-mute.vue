<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="noteMutingPagination">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
	</template>

	<template #default="{ items }">
		<MkFolder v-for="item in (items as entities.NotesMutingListResponse)" :key="item.id" style="margin-bottom: 1rem;">
			<template #label>
				<div>
					<span>[{{ i18n.ts.expiration }}: </span>
					<MkTime v-if="item.expiresAt" :time="item.expiresAt" mode="absolute"/>
					<span v-else>{{ i18n.ts.none }}</span>
					<span>] </span>
					<span>
						{{ ((item.note.user.name) ? item.note.user.name + ` (@${item.note.user.username})` : `@${item.note.user.username}`) }}
					</span>
					<span>
						{{ i18n.ts._noteMuting.labelSuffix }}
					</span>
				</div>
			</template>

			<template #default>
				<MkNoteSub :note="item.note"/>
			</template>

			<template #footer>
				<div style="display: flex; flex-direction: column" class="_gaps">
					<MkButton :danger="true" @click="onClickUnmuteNote(item.note.id)">{{ i18n.ts._noteMuting.unmuteNote }}</MkButton>
					<span :class="$style.caption">{{ i18n.ts._noteMuting.unmuteCaption }}</span>
				</div>
			</template>
		</MkFolder>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { entities } from 'misskey-js';
import { shallowRef } from 'vue';
import type { Paging } from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n';
import { infoImageUrl } from '@/instance';
import * as os from '@/os';

const noteMutingPagination: Paging = {
	endpoint: 'notes/muting/list',
	limit: 10,
};

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

async function onClickUnmuteNote(noteId: string) {
	await os.apiWithDialog(
		'notes/muting/delete',
		{
			noteId,
		},
		undefined,
		{
			'6ad3b6c9-f173-60f7-b558-5eea13896254': {
				title: i18n.ts.error,
				text: i18n.ts._noteMuting.notMutedNote,
			},
		},
	);

	pagingComponent.value?.reload();
}

</script>

<style lang="scss" module>
.caption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
