<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" class="rrevdjwu" :class="{ grid }">
	<MkInput
		v-if="searchIndex && searchIndex.length > 0"
		v-model="searchQuery"
		:placeholder="i18n.ts.search"
		type="search"
		style="margin-bottom: 16px;"
		@input.passive="searchOnInput"
		@keydown="searchOnKeyDown"
	>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<template v-if="rawSearchQuery == ''">
		<div v-for="group in def" class="group">
			<div v-if="group.title" class="title">{{ group.title }}</div>

			<div class="items">
				<template v-for="(item, i) in group.items">
					<a v-if="item.type === 'a'" :href="item.href" :target="item.target" class="_button item" :class="{ danger: item.danger, active: item.active }">
						<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
						<span class="text">{{ item.text }}</span>
					</a>
					<button v-else-if="item.type === 'button'" class="_button item" :class="{ danger: item.danger, active: item.active }" :disabled="item.active" @click="ev => item.action(ev)">
						<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
						<span class="text">{{ item.text }}</span>
					</button>
					<MkA v-else :to="item.to" class="_button item" :class="{ danger: item.danger, active: item.active }">
						<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
						<span class="text">{{ item.text }}</span>
					</MkA>
				</template>
			</div>
		</div>
	</template>
	<template v-else>
		<div v-for="item, index in searchResult">
			<MkA
				:to="item.path + '#' + item.id"
				class="_button searchResultItem"
				:class="{ selected: searchSelectedIndex !== null && searchSelectedIndex === index }"
			>
				<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
				<span class="text">
					<template v-if="item.isRoot">
						{{ item.label }}
					</template>
					<template v-else>
						<span style="opacity: 0.7; font-size: 90%; word-break: break-word;">{{ item.parentLabels.join(' > ') }}</span>
						<br>
						<span style="word-break: break-word;">{{ item.label }}</span>
					</template>
				</span>
			</MkA>
		</div>
	</template>
</div>
</template>

<script lang="ts">
import type { Awaitable } from '@/types/misc.js';

export type SuperMenuDef = {
	title?: string;
	items: ({
		type: 'a';
		href: string;
		target?: string;
		icon?: string;
		text: string;
		danger?: boolean;
		active?: boolean;
	} | {
		type: 'button';
		icon?: string;
		text: string;
		danger?: boolean;
		active?: boolean;
		action: (ev: PointerEvent) => Awaitable<void>;
	} | {
		type?: 'link';
		to: string;
		icon?: string;
		text: string;
		danger?: boolean;
		active?: boolean;
	})[];
};
</script>

<script lang="ts" setup>
import { useTemplateRef, ref, watch, nextTick, computed } from 'vue';
import { getScrollContainer } from '@@/js/scroll.js';
import type { SearchIndexItem } from '@/utility/inapp-search.js';
import MkInput from '@/components/MkInput.vue';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { initIntlString, compareStringIncludes } from '@/utility/intl-string.js';

const props = defineProps<{
	def: SuperMenuDef[];
	grid?: boolean;
	searchIndex?: SearchIndexItem[];
}>();

initIntlString();

const router = useRouter();
const rootEl = useTemplateRef('rootEl');

const searchQuery = ref('');
const rawSearchQuery = ref('');

const searchSelectedIndex = ref<null | number>(null);
const searchResult = ref<{
	id: string;
	path: string;
	label: string;
	icon?: string;
	isRoot: boolean;
	parentLabels: string[];
}[]>([]);
const searchIndexItemByIdComputed = computed(() => props.searchIndex && new Map<string, SearchIndexItem>(props.searchIndex.map(i => [i.id, i])));

watch(searchQuery, (value) => {
	rawSearchQuery.value = value;
});

watch(rawSearchQuery, (value) => {
	searchResult.value = [];
	searchSelectedIndex.value = null;

	if (value === '') {
		return;
	}

	const searchIndexItemById = searchIndexItemByIdComputed.value;
	if (searchIndexItemById != null) {
		const addSearchResult = (item: SearchIndexItem) => {
			let path: string | undefined = item.path;
			let icon: string | undefined = item.icon;
			const parentLabels: string[] = [];

			for (let current = searchIndexItemById.get(item.parentId ?? '');
				current != null;
				current = searchIndexItemById.get(current.parentId ?? '')) {
				path ??= current.path;
				icon ??= current.icon;
				parentLabels.push(current.label);
			}

			if (_DEV_ && path == null) throw new Error('path is null for ' + item.id);

			searchResult.value.push({
				id: item.id,
				path: path ?? '/', // never gets `/`
				label: item.label,
				parentLabels: parentLabels.toReversed(),
				icon,
				isRoot: item.parentId == null,
			});
		};

		// label, keywords, texts の順に優先して表示

		let items = Array.from(searchIndexItemById.values());

		for (const item of items) {
			if (compareStringIncludes(item.label, value)) {
				addSearchResult(item);
				items = items.filter(i => i.id !== item.id);
			}
		}

		for (const item of items) {
			if (item.keywords.some((x) => compareStringIncludes(x, value))) {
				addSearchResult(item);
				items = items.filter(i => i.id !== item.id);
			}
		}

		for (const item of items) {
			if (item.texts.some((x) => compareStringIncludes(x, value))) {
				addSearchResult(item);
				items = items.filter(i => i.id !== item.id);
			}
		}
	}
});

function searchOnInput(ev: InputEvent) {
	searchSelectedIndex.value = null;
	rawSearchQuery.value = (ev.target as HTMLInputElement).value;
}

function searchOnKeyDown(ev: KeyboardEvent) {
	if (ev.isComposing) return;

	if (ev.key === 'Enter' && searchSelectedIndex.value != null) {
		ev.preventDefault();
		router.pushByPath(searchResult.value[searchSelectedIndex.value].path + '#' + searchResult.value[searchSelectedIndex.value].id);
	} else if (ev.key === 'ArrowDown') {
		ev.preventDefault();
		const current = searchSelectedIndex.value ?? -1;
		searchSelectedIndex.value = current + 1 >= searchResult.value.length ? 0 : current + 1;
	} else if (ev.key === 'ArrowUp') {
		ev.preventDefault();
		const current = searchSelectedIndex.value ?? 0;
		searchSelectedIndex.value = current - 1 < 0 ? searchResult.value.length - 1 : current - 1;
	}

	if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
		nextTick(() => {
			if (!rootEl.value) return;
			const selectedEl = rootEl.value.querySelector<HTMLElement>('.searchResultItem.selected');
			if (selectedEl != null) {
				const scrollContainer = getScrollContainer(selectedEl);
				if (!scrollContainer) return;
				scrollContainer.scrollTo({
					top: selectedEl.offsetTop - scrollContainer.clientHeight / 2 + selectedEl.clientHeight / 2,
					behavior: 'instant',
				});
			}
		});
	}
}
</script>

<style lang="scss" scoped>
.rrevdjwu {
	> .group {
		& + .group {
			margin-top: 16px;
			padding-top: 16px;
			border-top: solid 0.5px var(--MI_THEME-divider);
		}

		> .title {
			opacity: 0.7;
			margin: 0 0 8px 0;
			font-size: 0.9em;
		}

		> .items {
			> .item {
				display: flex;
				align-items: center;
				width: 100%;
				box-sizing: border-box;
				padding: 9px 16px 9px 8px;
				border-radius: 9px;
				font-size: 0.9em;

				&:hover {
					text-decoration: none;
					background: var(--MI_THEME-panelHighlight);
				}

				&:focus-visible {
					outline-offset: -2px;
				}

				&.active {
					color: var(--MI_THEME-accent);
					background: var(--MI_THEME-accentedBg);
				}

				&.danger {
					color: var(--MI_THEME-error);
				}

				> .icon {
					width: 32px;
					margin-right: 2px;
					flex-shrink: 0;
					text-align: center;
					opacity: 0.8;
				}

				> .text {
					white-space: normal;
					padding-right: 12px;
					flex-shrink: 1;
				}

			}
		}
	}

	&.grid {
		> .group {
			margin-left: 0;
			margin-right: 0;

			& + .group {
				padding-top: 0;
				border-top: none;
			}

			> .title {
				font-size: 1em;
				opacity: 0.7;
				margin: 0 0 8px 16px;
			}

			> .items {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
				grid-gap: 16px;
				padding: 0 16px;

				> .item {
					flex-direction: column;
					text-align: center;
					padding: 0;

					&:hover {
						text-decoration: none;
						background: none;
						color: var(--MI_THEME-accent);

						> .icon {
							background: var(--MI_THEME-accentedBg);
						}
					}

					> .icon {
						display: grid;
						place-content: center;
						margin-right: 0;
						margin-bottom: 6px;
						font-size: 1.5em;
						width: 60px;
						height: 60px;
						aspect-ratio: 1;
						background: var(--MI_THEME-panel);
						border-radius: 100%;
					}

					> .text {
						padding-right: 0;
						width: 100%;
						font-size: 0.8em;
					}
				}
			}
		}
	}

	.searchResultItem {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 9px 16px 9px 8px;
		border-radius: 9px;
		font-size: 0.9em;

		&:hover {
			text-decoration: none;
			background: var(--MI_THEME-panelHighlight);
		}

		&.selected {
			outline: 2px solid var(--MI_THEME-focus);
		}

		&:focus-visible,
		&.selected {
			outline-offset: -2px;
		}

		&.active {
			color: var(--MI_THEME-accent);
			background: var(--MI_THEME-accentedBg);
		}

		&.danger {
			color: var(--MI_THEME-error);
		}

		> .icon {
			width: 32px;
			margin-right: 2px;
			flex-shrink: 0;
			text-align: center;
			opacity: 0.8;
		}

		> .text {
			white-space: normal;
			padding-right: 12px;
			flex-shrink: 1;
		}
	}
}
</style>
