<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh && pullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => paginator.reload()" @contextmenu.prevent.stop="onContextmenu">
	<div>
		<MkPaginationControl v-if="props.withControl" :paginator="paginator" style="margin-bottom: 10px"/>

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
				<slot :items="unref(paginator.items)" :fetching="paginator.fetching.value || paginator.fetchingOlder.value"></slot>
				<div v-if="paginator.order.value === 'oldest'">
					<MkButton v-if="!paginator.fetchingNewer.value" :class="$style.more" :wait="paginator.fetchingNewer.value" primary rounded @click="paginator.fetchNewer()">
						{{ i18n.ts.loadMore }}
					</MkButton>
					<MkLoading v-else/>
				</div>
				<div v-else v-show="paginator.canFetchOlder.value">
					<MkButton v-if="!paginator.fetchingOlder.value" :class="$style.more" :wait="paginator.fetchingOlder.value" primary rounded @click="paginator.fetchOlder()">
						{{ i18n.ts.loadMore }}
					</MkButton>
					<MkLoading v-else/>
				</div>
			</div>
		</Transition>
	</div>
</component>
</template>

<script lang="ts" setup generic="T extends IPaginator">
import { isLink } from '@@/js/is-link.js';
import { onMounted, watch, unref } from 'vue';
import type { UnwrapRef } from 'vue';
import type { IPaginator } from '@/utility/paginator.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import MkPaginationControl from '@/components/MkPaginationControl.vue';
import * as os from '@/os.js';

const props = withDefaults(defineProps<{
	paginator: T;
	autoLoad?: boolean;
	pullToRefresh?: boolean;
	withControl?: boolean;
}>(), {
	autoLoad: true,
	pullToRefresh: true,
	withControl: false,
});

function onContextmenu(ev: MouseEvent) {
	if (ev.target && isLink(ev.target as HTMLElement)) return;
	if (window.getSelection()?.toString() !== '') return;

	// TODO: 並び順設定
	os.contextMenu([{
		icon: 'ti ti-refresh',
		text: i18n.ts.reload,
		action: () => {
			props.paginator.reload();
		},
	}], ev);
}

if (props.autoLoad) {
	onMounted(() => {
		props.paginator.init();
	});
}

if (props.paginator.computedParams) {
	watch(props.paginator.computedParams, () => {
		props.paginator.reload();
	}, { immediate: false, deep: true });
}

defineSlots<{
	empty: () => void;
	default: (props: { items: UnwrapRef<T['items']> }) => void;
}>();
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

.more {
	margin-left: auto;
	margin-right: auto;
}
</style>
