<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh && pullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => paginator.reload()" @contextmenu.prevent.stop="onContextmenu">
	<div>
		<div v-if="props.withControl" :class="$style.controls">
			<div :class="$style.control">
				<MkSelect v-model="order" :class="$style.order" :items="[{ label: i18n.ts._order.newest, value: 'newest' }, { label: i18n.ts._order.oldest, value: 'oldest' }]">
					<template #prefix><i class="ti ti-arrows-sort"></i></template>
				</MkSelect>
				<!-- TODO -->
				<!-- <MkButton v-tooltip="i18n.ts.search" iconOnly transparent rounded @click="setSearchQuery"><i class="ti ti-search"></i></MkButton> -->
				<MkButton v-tooltip="i18n.ts.dateAndTime" iconOnly transparent rounded :active="date != null" @click="date = date == null ? Date.now() : null"><i class="ti ti-calendar-clock"></i></MkButton>
				<MkButton v-tooltip="i18n.ts.reload" iconOnly transparent rounded @click="paginator.reload()"><i class="ti ti-refresh"></i></MkButton>
			</div>

			<MkInput
				v-if="date != null"
				type="date"
				:modelValue="formatDateTimeString(new Date(date), 'yyyy-MM-dd')"
				@update:modelValue="date = new Date($event).getTime()"
			>
			</MkInput>
		</div>

		<!-- :css="prefer.s.animation" にしたいけどバグる(おそらくvueのバグ) https://github.com/misskey-dev/misskey/issues/16078 -->
		<Transition
			:enterActiveClass="prefer.s.animation ? $style.transition_fade_enterActive : ''"
			:leaveActiveClass="prefer.s.animation ? $style.transition_fade_leaveActive : ''"
			:enterFromClass="prefer.s.animation ? $style.transition_fade_enterFrom : ''"
			:leaveToClass="prefer.s.animation ? $style.transition_fade_leaveTo : ''"
			mode="out-in"
		>
			<MkLoading v-if="paginator.fetching.value"/>

			<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

			<div v-else-if="paginator.items.value.length === 0" key="_empty_">
				<slot name="empty"><MkResult type="empty"/></slot>
			</div>

			<div v-else key="_root_" class="_gaps">
				<slot :items="paginator.items.value" :fetching="paginator.fetching.value || paginator.fetchingOlder.value"></slot>
				<div v-if="order === 'oldest'">
					<MkButton v-if="!paginator.fetchingNewer.value" :class="$style.more" :wait="paginator.fetchingNewer.value" primary rounded @click="paginator.fetchNewer">
						{{ i18n.ts.loadMore }}
					</MkButton>
					<MkLoading v-else/>
				</div>
				<div v-else v-show="paginator.canFetchOlder.value">
					<MkButton v-if="!paginator.fetchingOlder.value" :class="$style.more" :wait="paginator.fetchingOlder.value" primary rounded @click="paginator.fetchOlder">
						{{ i18n.ts.loadMore }}
					</MkButton>
					<MkLoading v-else/>
				</div>
			</div>
		</Transition>
	</div>
</component>
</template>

<script lang="ts" setup generic="T extends PagingCtx">
import { isLink } from '@@/js/is-link.js';
import { ref, watch } from 'vue';
import type { UnwrapRef } from 'vue';
import type { PagingCtx } from '@/composables/use-pagination.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { usePagination } from '@/composables/use-pagination.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os.js';
import { formatDateTimeString } from '@/utility/format-time-string.js';

type Paginator = ReturnType<typeof usePagination<T['endpoint']>>;

const props = withDefaults(defineProps<{
	pagination: T;
	disableAutoLoad?: boolean;
	displayLimit?: number;
	pullToRefresh?: boolean;
	withControl?: boolean;
}>(), {
	displayLimit: 20,
	pullToRefresh: true,
	withControl: false,
});

const order = ref<'newest' | 'oldest'>(props.pagination.order ?? 'newest');
const date = ref<number | null>(null);

const paginator: Paginator = usePagination({
	ctx: props.pagination,
});

watch([order, date], () => {
	paginator.updateCtx({
		...props.pagination,
		order: order.value,
		initialDirection: order.value === 'oldest' ? 'newer' : 'older',
		initialDate: date.value,
	});
}, { immediate: false });

function onContextmenu(ev: MouseEvent) {
	if (ev.target && isLink(ev.target as HTMLElement)) return;
	if (window.getSelection()?.toString() !== '') return;

	// TODO: 並び順設定
	os.contextMenu([{
		icon: 'ti ti-refresh',
		text: i18n.ts.reload,
		action: () => {
			paginator.reload();
		},
	}], ev);
}

defineSlots<{
	empty: () => void;
	default: (props: { items: UnwrapRef<Paginator['items']> }) => void;
}>();

defineExpose({
	paginator: paginator,
});
</script>

<style lang="scss" module>
.transition_fade_enterActive,
.transition_fade_leaveActive {
	transition: opacity 0.125s ease;
}
.transition_fade_enterFrom,
.transition_fade_leaveTo {
	opacity: 0;
}

.controls {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 10px;
}

.control {
	display: flex;
	align-items: center;
	gap: 4px;
}

.order {
	flex: 1;
	margin-right: 6px;
}

.more {
	margin-left: auto;
	margin-right: auto;
}
</style>
