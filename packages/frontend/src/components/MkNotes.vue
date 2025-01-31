<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div ref="rootEl" :class="[$style.root, { [$style.noGap]: noGap }]">
			<MkDateSeparatedList
				ref="notes"
				v-slot="{ item: note }"
				:items="notes"
				:direction="pagination.reversed ? 'up' : 'down'"
				:reversed="pagination.reversed"
				:noGap="noGap"
				:ad="true"
				:class="$style.notes"
			>
				<XNote
					:key="note._featuredId_ || note._prId_ || note.id"
					:class="$style.note"
					:data-id="note.id"
					:note="note"
					:visible="disableJsRenderSkip || !initialComputeDone || visibleNotes.has(note.id)"
					:withHardMute="true"
				/>
			</MkDateSeparatedList>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { useTemplateRef, ref, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount, nextTick } from 'vue';
import XNote from '@/components/MkNotes.note.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { defaultStore } from '@/store.js';
import { getScrollContainer } from '@@/js/scroll.js';

const props = withDefaults(defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
	disableJsRenderSkip?: boolean;
}>(), {
	disableJsRenderSkip: false,
});

const pagingComponent = useTemplateRef('pagingComponent');
const rootEl = useTemplateRef('rootEl');

//#region Note Render Skipping (JS)
let intersectionObserver: IntersectionObserver | null = null;
let mutationObserver: MutationObserver | null = null;
const visibleNotes = ref(new Set<string>());
const initialComputeDone = ref(false);

function initNoteRenderSkipping() {
	if (_DEV_) console.log('initNoteRenderSkipping');

	if (
		!props.disableJsRenderSkip &&
		defaultStore.state.skipNoteRender === 'js'
	) {
		watch(rootEl, (to) => {
			if (to != null) {
				const rootClientRect = to.getBoundingClientRect();

				// 初回：現在見えているノートを洗い出す
				initialComputeDone.value = false;
				visibleNotes.value.clear();
				rootEl.value.querySelectorAll('[data-id]').forEach((note) => {
					const id = (note as HTMLElement).dataset?.id;
					if (id) {
						const rect = (note as HTMLElement).getBoundingClientRect();
						if (rect.top < window.innerHeight && rect.bottom > 0) {
							visibleNotes.value.add(id);
						}
					}
				});
				initialComputeDone.value = true;

				// 画面内に入ったノートを記録
				intersectionObserver = new IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						if (rootEl.value == null) return;
						if (rootEl.value.classList.contains('list-move')) return;
						if (entry.isIntersecting) {
							const note = entry.target as HTMLElement;
							const id = note.dataset?.id;
							if (id) {
								if (_DEV_) console.log('visible', id);
								visibleNotes.value.add(id);
							}
						} else {
							const note = entry.target as HTMLElement;
							const id = note.dataset?.id;
							if (id) {
								if (_DEV_) console.log('invisible', id);
								visibleNotes.value.delete(id);
							}
						}
					});
				}, {
					root: getScrollContainer(rootEl.value),
					rootMargin: '50% 0% 50% 0%',
				});

				// 初回
				rootEl.value.querySelectorAll('[data-id]').forEach((note) => {
					intersectionObserver!.observe(note as Element);
				});

				// ノートが追加されたらそれもIntersectionObserverに登録
				// 削除されたらIntersectionObserverから削除
				mutationObserver = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						mutation.addedNodes.forEach((note) => {
							if (note.dataset?.id == null) return;
							const rect = (note as HTMLElement).getBoundingClientRect();
							if (rect.top < window.innerHeight && rect.bottom > 0) {
								visibleNotes.value.add(note.dataset.id);
							}
							intersectionObserver!.observe(note as Element);
						});
						mutation.removedNodes.forEach((note) => {
							if (note.dataset?.id == null) return;
							intersectionObserver!.unobserve(note as Element);
						});
					});
				});

				mutationObserver.observe(rootEl.value, {
					childList: true,
					subtree: true,
				});
			} else {
				if (intersectionObserver) {
					intersectionObserver.disconnect();
				}
				if (mutationObserver) {
					mutationObserver.disconnect();
				}
			}
		}, { flush: 'post' });
	}
}

function disposeNoteRenderSkipping() {
	if (_DEV_) console.log('disposeNoteRenderSkipping');

	if (intersectionObserver) {
		intersectionObserver.disconnect();
	}
	if (mutationObserver) {
		mutationObserver.disconnect();
	}
	visibleNotes.value.clear();
	initialComputeDone.value = false;
}

onActivated(() => {
	initNoteRenderSkipping();
});

onBeforeUnmount(() => {
	disposeNoteRenderSkipping();
});

onDeactivated(() => {
	disposeNoteRenderSkipping();
});
//#endregion

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	&.noGap {
		> .notes {
			background: var(--MI_THEME-panel);
		}
	}

	&:not(.noGap) {
		> .notes {
			background: var(--MI_THEME-bg);

			.note {
				background: var(--MI_THEME-panel);
				border-radius: var(--MI-radius);
			}
		}
	}
}
</style>
