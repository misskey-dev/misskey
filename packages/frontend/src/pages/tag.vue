<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkNotes ref="notes" class="" :pagination="pagination"/>
	</MkSpacer>
	<template v-if="$i" #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="800" :marginMin="16" :marginMax="16">
				<MkButton rounded primary :class="$style.button" @click="post()"><i class="ti ti-pencil"></i>{{ i18n.ts.postToHashtag }}</MkButton>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkButton from '@/components/MkButton.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { defaultStore } from '@/store';
import * as os from '@/os';

const props = defineProps<{
	tag: string;
}>();

const pagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};
const notes = ref<InstanceType<typeof MkNotes>>();

async function post() {
	defaultStore.set('postFormHashtags', props.tag);
	defaultStore.set('postFormWithHashtags', true);
	await os.post();
	defaultStore.set('postFormHashtags', '');
	defaultStore.set('postFormWithHashtags', false);
	notes.value?.pagingComponent?.reload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: props.tag,
	icon: 'ti ti-hash',
})));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-top: solid 0.5px var(--divider);
	display: flex;
}

.button {
		margin: 0 auto var(--margin) auto;
}
</style>
