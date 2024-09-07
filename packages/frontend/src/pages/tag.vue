<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
		<div v-if="tab === 'notes'" key="notes">
			<XNotes ref="notesTag" :tag="tag"/>
		</div>
		<div v-else-if="tab === 'users'" key="users">
			<XUsers :tag="tag"/>
		</div>
	</MkHorizontalSwipe>
	<template v-if="$i && tab === 'notes'" #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="800" :marginMin="16" :marginMax="16">
				<MkButton rounded primary :class="$style.button" @click="post()"><i class="ti ti-pencil"></i>{{ i18n.ts.postToHashtag }}</MkButton>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XUsers from './tag.user.vue';
import XNotes from './tag.note.vue';
import MkButton from '@/components/MkButton.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';

const props = withDefaults(defineProps<{
	tag: string;
	initialTab?: 'notes' | 'users';
}>(), {
	initialTab: 'notes',
});

// eslint-disable-next-line vue/no-setup-props-destructure
const tab = ref<'notes' | 'users'>(props.initialTab);

const notesTag = ref<InstanceType<typeof XNotes>>();

async function post() {
	defaultStore.set('postFormHashtags', props.tag);
	defaultStore.set('postFormWithHashtags', true);
	await os.post();
	defaultStore.set('postFormHashtags', '');
	defaultStore.set('postFormWithHashtags', false);
	notesTag.value?.reload();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'notes',
	icon: 'ti ti-pencil',
	title: i18n.ts.notes,
}, {
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}]);

definePageMetadata(() => ({
	title: props.tag,
	icon: 'ti ti-hash',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	background: var(--acrylicBg);
	border-top: solid 0.5px var(--divider);
	display: flex;
}

.button {
	margin: 0 auto;
}
</style>
