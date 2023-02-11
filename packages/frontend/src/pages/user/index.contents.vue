<template>
<MkStickyContainer ref="containerEl">
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs" :scroll-to-top="scrollToTop" :actions="headerActions" :hide-title="true" style="--headerHeight: 40px"/></template>
	<div ref="contentEl">
		<Transition name="fade" mode="out-in">
			<div v-if="user">
				<XTimeline v-if="tab === 'notes' || tab === 'files' || tab === 'replies'" :tab="tab" :user="user" />
				<XActivity v-else-if="tab === 'activity'" :user="user"/>
				<XAchievements v-else-if="tab === 'achievements'" :user="user"/>
				<XReactions v-else-if="tab === 'reactions'" :user="user"/>
				<XClips v-else-if="tab === 'clips'" :user="user"/>
				<XPages v-else-if="tab === 'pages'" :user="user"/>
				<XGallery v-else-if="tab === 'gallery'" :user="user"/>
			</div>
			<MkError v-else-if="error" @retry="emit('requestRetry')"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, provide, watchEffect } from 'vue';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import type MkStickyContainer from '@/components/global/MkStickyContainer.vue';
import type { Tab } from '@/components/global/MkPageHeader.tabs.vue';
import { getScrollContainer } from '@/scripts/scroll';

const XTimeline = defineAsyncComponent(() => import('./index.timeline.vue'));
const XActivity = defineAsyncComponent(() => import('./activity.vue'));
const XAchievements = defineAsyncComponent(() => import('./achievements.vue'));
const XReactions = defineAsyncComponent(() => import('./reactions.vue'));
const XClips = defineAsyncComponent(() => import('./clips.vue'));
const XPages = defineAsyncComponent(() => import('./pages.vue'));
const XGallery = defineAsyncComponent(() => import('./gallery.vue'));

const props = withDefaults(defineProps<{
	acct: string;
	user: any;
	page?: 'notes' | 'replies' | 'files' | 'activity' | 'achievements' | 'reactions' | 'clips' | 'pages' | 'gallery';
}>(), {
	page: 'notes',
});

const emit = defineEmits<{
	(e: 'requestRetry'): void;
}>()

provide('shouldOmitHeaderTitle', true);

let tab = $ref(props.page);
let error = $ref(null);

let containerEl = $shallowRef<InstanceType<typeof MkStickyContainer>>();
let contentEl = $shallowRef<HTMLElement>();

const scrollToTop = $computed(() => {
	if (containerEl) return containerEl.scrollToTop;
	return () => undefined;
});

watchEffect(() => {
	if (contentEl && containerEl) {
		const scrollContainer = getScrollContainer(contentEl);
		const scrollHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
		contentEl.style.minHeight = `calc(${scrollHeight - containerEl.stickyTop}px - var(--minBottomSpacing))`;
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => props.user ? [{
	key: 'notes',
	title: i18n.ts.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'replies',
	title: i18n.ts.notesAndReplies,
	icon: 'ti ti-arrow-back-up',
}, {
	key: 'files',
	title: i18n.ts.withFiles,
	icon: 'ti ti-photo',
}, {
	key: 'activity',
	title: i18n.ts.activity,
	icon: 'ti ti-chart-line',
}, ...(props.user.host == null ? [{
	key: 'achievements',
	title: i18n.ts.achievements,
	icon: 'ti ti-medal',
}] : []), ...($i && ($i.id === props.user.id)) || props.user.publicReactions ? [{
	key: 'reactions',
	title: i18n.ts.reaction,
	icon: 'ti ti-mood-happy',
}] : [], {
	key: 'clips',
	title: i18n.ts.clips,
	icon: 'ti ti-paperclip',
}, {
	key: 'pages',
	title: i18n.ts.pages,
	icon: 'ti ti-news',
}, {
	key: 'gallery',
	title: i18n.ts.gallery,
	icon: 'ti ti-icons',
}] as Tab[] : []);
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
