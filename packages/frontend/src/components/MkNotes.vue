<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad" :virtualScrollOn="virtualScrollOn">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

		<template #default="{ items: notes }" v-if="!virtualScrollOn">
			<div :class="[$style.root, { [$style.noGap]: noGap }]">
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
					<MkNote :key="note._featuredId_ || note._prId_ || note.id" :class="$style.note" :note="note" :withHardMute="true"/>
				</MkDateSeparatedList>
			</div>
	</template>
	<template #default="{ item: note, index, items }"  v-else>
		<div :class="[$style.root, { [$style.noGap]: noGap },{ [$style.dateseparatedlist]: noGap}]">
			<div :class="$style.notes,{ [$style.dateseparatedlistnogap]: noGap}" >
				<p :style="{margin: 0, borderBottom: 'solid 1px var(--divider)'}"></p>
				<div :class="$style.notes, { [$style.dateseparatedlistnogap]: noGap}">
					<p v-if="index !== 0" :style="{margin: 0, borderBottom: 'solid 1px var(--divider)'}"></p>
					<MkNote v-if="props.withCw && !note.cw || !props.withCw" :key="note._featuredId_ || note._prId_ || note.id" :class="$style.note" :note="note" :withHardMute="true"/>
					<div v-if="index !== items.length - 1 && note?.createdAt && items[index + 1]?.createdAt && (new Date(note?.createdAt).getDate()) !== ( new Date(items[index + 1]?.createdAt).getDate())" :key="note.id" :class="$style.separator">
						<p :class="$style.date">
						<span :class="$style.date1">
							<i class="ti ti-chevron-up"></i>
							{{ getDateText(note.createdAt) }}
						</span>
							<span :class="$style.date2">
							{{ getDateText(items[index + 1].createdAt) }}
							<i class="ti ti-chevron-down"></i>
						</span>
						</p>
					</div>
				</div>
			</div>
			</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { shallowRef,ref } from 'vue';
import MkNote from '@/components/MkNote.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import MkDateSeparatedList from "@/components/MkDateSeparatedList.vue";
import {defaultStore} from "@/store.js";
const dateTextCache = new Map<string, string>();
const virtualScrollOn = ref(false);
virtualScrollOn.value = defaultStore.state.virtualScrollOn;
const props = defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
    withCw?: boolean;
}>();
const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

function getDateText(time: string) {
	if (dateTextCache.has(time)) {
		return dateTextCache.get(time)!;
	}
	const date = new Date(time).getDate();
	const month = new Date(time).getMonth() + 1;
	const text = i18n.tsx.monthAndDay({
		month: month.toString(),
		day: date.toString(),
	});
	dateTextCache.set(time, text);
	return text;
}

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	&.noGap {
		> .notes {
			background: var(--panel);
		}
		.note{
			&:not(:last-child) {
				border-bottom: solid 0.5px var(--divider);
			}
		}
	}

	&:not(.noGap) {
		> .notes {
			background: var(--bg);
			.note {
				background: var(--panel);
				border-radius: var(--radius);
			}
		}
	}
}
.dateseparatedlist {
	container-type: inline-size;

	&:global {
		> .list-move {
			transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
		}

		&.deny-move-transition > .list-move {
			transition: none !important;
		}

		> .list-enter-active {
			transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);
		}

		> *:empty {
			display: none;
		}
	}

	&:not(.date-separated-list-nogap) > *:not(:last-child) {
		margin-bottom: var(--margin);
	}
}

.dateseparatedlistnogap {
	> * {
		margin: 0 !important;
		border: none;
		border-radius: 0;
		box-shadow: none;

		&:not(:last-child) {
			border-bottom: solid 0.5px var(--divider);
		}
	}
}

.direction-up {
	&:global {
		> .list-enter-from,
		> .list-leave-to {
			opacity: 0;
			transform: translateY(64px);
		}
	}
}
.direction-down {
	&:global {
		> .list-enter-from,
		> .list-leave-to {
			opacity: 0;
			transform: translateY(-64px);
		}
	}
}

.reversed {
	display: flex;
	flex-direction: column-reverse;
}

.separator {
	border-bottom: solid 1px var(--divider);
	text-align: center;
}

.date {
	display: inline-block;
	position: relative;
	margin: 0;
	padding: 0 16px;
	line-height: 32px;
	text-align: center;
	font-size: 12px;
	color: var(--dateLabelFg);
}

.date1 {
	margin-right: 8px;
}

.date1icon {
	margin-right: 8px;
}

.date2 {
	margin-left: 8px;
}

.date2icon {
	margin-left: 8px;
}

.before-leave {
	position: absolute !important;
}
</style>
