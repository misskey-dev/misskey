<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" class="mkw-bdayfollowings">
	<template #icon><i class="ti ti-cake"></i></template>
	<template #header>{{ i18n.ts._widgets.birthdayFollowings }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="fetch(true)"><i class="ti ti-refresh"></i></button></template>

	<MkPagination v-slot="{ items }" :paginator="birthdayUsersPaginator">
		<div :class="$style.bdayUserRoot">
			<template v-for="(user, i) in items" :key="user.id">
				<div
					v-if="i > 0 && isSeparatorNeeded(birthdayUsersPaginator.items.value[i - 1].birthday, user.birthday)"
				>
					<div :class="$style.date">
						<span><i class="ti ti-chevron-up"></i> {{ getSeparatorInfo(birthdayUsersPaginator.items.value[i - 1].birthday, user.birthday)?.prevText }}</span>
						<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
						<span>{{ getSeparatorInfo(birthdayUsersPaginator.items.value[i - 1].birthday, user.birthday)?.nextText }} <i class="ti ti-chevron-down"></i></span>
					</div>
					<!-- user -->
				</div>
				<div v-else>
					<!-- user -->
				</div>
			</template>
		</div>
	</MkPagination>
</MkContainer>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import { useInterval } from '@@/js/use-interval.js';
import { isSeparatorNeeded, getSeparatorInfo } from '@/utility/timeline-date-separate.js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';

const name = 'birthdayFollowings';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 300,
	},
	period: {
		type: 'radio' as const,
		default: '3day',
		options: [{
			value: 'today' as const,
			label: i18n.ts.today,
		}, {
			value: '3day' as const,
			label: i18n.tsx.dayX({ day: 3 }),
		}, {
			value: 'week' as const,
			label: i18n.ts.oneWeek,
		}, {
			value: 'month' as const,
			label: i18n.ts.oneMonth,
		}],
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

const begin = ref<Date>(new Date());
const end = computed(() => {
	switch (widgetProps.period) {
		case '3day':
			return new Date(begin.value.getTime() + 1000 * 60 * 60 * 24 * 3);
		case 'week':
			return new Date(begin.value.getTime() + 1000 * 60 * 60 * 24 * 7);
		case 'month':
			return new Date(begin.value.getTime() + 1000 * 60 * 60 * 24 * 30);
		default:
			return begin.value;
	}
});

const birthdayUsersPaginator = markRaw(new Paginator('users/get-following-birthday-users', {
	limit: 18,
	offsetMode: true,
	computedParams: computed(() => {
		if (widgetProps.period === 'today') {
			return {
				birthday: {
					month: begin.value.getMonth() + 1,
					day: begin.value.getDate(),
				},
			};
		} else {
			return {
				birthday: {
					begin: {
						month: begin.value.getMonth() + 1,
						day: begin.value.getDate(),
					},
					end: {
						month: end.value.getMonth() + 1,
						day: end.value.getDate(),
					},
				},
			};
		}
	}),
}));

function fetch(force = false) {
	const now = new Date();
	if (force || now.getDate() !== begin.value.getDate()) {
		// computed() で再評価されるので、paginationEl.value!.reload() は不要
		begin.value = now;
	}
}

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

// eslint-disable-next-line vue/no-setup-props-destructure
defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.post {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 40px;
	margin: auto;
	aspect-ratio: 1/1;
	border-radius: 100%;
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));

	&:hover, &.active {
		&:before {
			background: var(--accentLighten);
		}
	}
}

.postIcon {
	color: var(--fgOnAccent);
}
</style>
