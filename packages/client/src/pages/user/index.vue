<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<div>
		<transition name="fade" mode="out-in">
			<div v-if="user">
				<XHome v-if="tab === 'home'" :user="user"/>
				<XReactions v-else-if="tab === 'reactions'" :user="user"/>
				<XClips v-else-if="tab === 'clips'" :user="user"/>
				<XPages v-else-if="tab === 'pages'" :user="user"/>
				<XGallery v-else-if="tab === 'gallery'" :user="user"/>
			</div>
			<MkError v-else-if="error" @retry="fetch()"/>
			<MkLoading v-else/>
		</transition>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import calcAge from 's-age';
import * as Acct from 'misskey-js/built/acct';
import * as misskey from 'misskey-js';
import { getScrollPosition } from '@/scripts/scroll';
import { getUserMenu } from '@/scripts/get-user-menu';
import number from '@/filters/number';
import { userPage, acct as getAcct } from '@/filters/user';
import * as os from '@/os';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const XHome = defineAsyncComponent(() => import('./home.vue'));
const XReactions = defineAsyncComponent(() => import('./reactions.vue'));
const XClips = defineAsyncComponent(() => import('./clips.vue'));
const XPages = defineAsyncComponent(() => import('./pages.vue'));
const XGallery = defineAsyncComponent(() => import('./gallery.vue'));

const props = withDefaults(defineProps<{
	acct: string;
	page?: string;
}>(), {
	page: 'home',
});

const router = useRouter();

let tab = $ref(props.page);
let user = $ref<null | misskey.entities.UserDetailed>(null);
let error = $ref(null);

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

function menu(ev) {
	os.popupMenu(getUserMenu(user), ev.currentTarget ?? ev.target);
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => user ? [{
	key: 'home',
	title: i18n.ts.overview,
	icon: 'fas fa-home',
}, ...($i && ($i.id === user.id)) || user.publicReactions ? [{
	key: 'reactions',
	title: i18n.ts.reaction,
	icon: 'fas fa-laugh',
}] : [], {
	key: 'clips',
	title: i18n.ts.clips,
	icon: 'fas fa-paperclip',
}, {
	key: 'pages',
	title: i18n.ts.pages,
	icon: 'fas fa-file-alt',
}, {
	key: 'gallery',
	title: i18n.ts.gallery,
	icon: 'fas fa-icons',
}] : null);

definePageMetadata(computed(() => user ? {
	icon: 'fas fa-user',
	title: user.name ? `${user.name} (@${user.username})` : `@${user.username}`,
	subtitle: `@${getAcct(user)}`,
	userName: user,
	avatar: user,
	path: `/@${user.username}`,
	share: {
		title: user.name,
	},
	bg: 'var(--bg)',
} : null));
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
