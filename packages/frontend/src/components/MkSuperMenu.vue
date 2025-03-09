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
						<span style="opacity: 0.7; font-size: 90%;">{{ item.parentLabels.join(' > ') }}</span>
						<br>
						<span>{{ item.label }}</span>
					</template>
				</span>
			</MkA>
		</div>
	</template>
</div>
</template>

<script lang="ts">
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
		action: (ev: MouseEvent) => void | Promise<void>;
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
import { useTemplateRef, ref, watch, nextTick } from 'vue';
import type { SearchIndexItem } from '@/scripts/autogen/settings-search-index.js';
import MkInput from '@/components/MkInput.vue';
import { i18n } from '@/i18n.js';
import { getScrollContainer } from '@@/js/scroll.js';
import { useRouter } from '@/router/supplier.js';
import { initIntlString, compareStringIncludes } from '@/scripts/intl-string.js';

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

watch(searchQuery, (value) => {
	rawSearchQuery.value = value;
});

watch(rawSearchQuery, (value) => {
	searchResult.value = [];
	searchSelectedIndex.value = null;

	if (value === '') {
		return;
	}

	const dive = (items: SearchIndexItem[], parents: SearchIndexItem[] = []) => {
		for (const item of items) {
			const matched = (
				compareStringIncludes(item.label, value) ||
				item.keywords.some((x) => compareStringIncludes(x, value))
			);

			if (matched) {
				searchResult.value.push({
					id: item.id,
					path: item.path ?? parents.find((x) => x.path != null)?.path ?? '/', // never gets `/`
					label: item.label,
					parentLabels: parents.map((x) => x.label).toReversed(),
					icon: item.icon ?? parents.find((x) => x.icon != null)?.icon,
					isRoot: parents.length === 0,
				});
			}

			if (item.children) {
				dive(item.children, [item, ...parents]);
			}
		}
	};

	if (props.searchIndex) {
		dive(props.searchIndex);
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
		router.push(searchResult.value[searchSelectedIndex.value].path + '#' + searchResult.value[searchSelectedIndex.value].id);
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
