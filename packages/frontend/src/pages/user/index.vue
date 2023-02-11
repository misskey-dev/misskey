<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions"/></template>
	<XHome v-if="user" :user="user" :class="$style.home"/>
	<XContents v-if="user" :acct="acct" :user="user" :page="page" @request-retry="fetchUser"></XContents>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import * as misskey from 'misskey-js';
import { acct as getAcct } from '@/filters/user';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import type MkStickyContainer from '@/components/global/MkStickyContainer.vue';
import XHome from './home.vue';
import XContents from './index.contents.vue';

const props = withDefaults(defineProps<{
	acct: string;
	page?: 'notes' | 'activity' | 'achievements' | 'reactions' | 'clips' | 'pages' | 'gallery';
}>(), {
	page: 'notes',
});

let user = $ref<null | misskey.entities.UserDetailed>(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user = null;
	os.api('users/show', Acct.parse(props.acct)).then(u => {
		user = u;
	}).catch(err => {
		error = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = $computed(() => []);

definePageMetadata(computed(() => user ? {
	icon: 'ti ti-user',
	title: user.name ? `${user.name} (@${user.username})` : `@${user.username}`,
	subtitle: `@${getAcct(user)}`,
	userName: user,
	avatar: user,
	path: `/@${user.username}`,
	share: {
		title: user.name,
	},
} : null));
</script>

<style lang="scss" module>
.home {
	border-bottom: solid 0.5px var(--divider)
}
</style>
