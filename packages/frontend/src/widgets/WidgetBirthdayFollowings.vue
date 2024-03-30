<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" class="mkw-bdayfollowings">
	<template #icon><i class="ti ti-cake"></i></template>
	<template v-if="widgetProps.period === 'today'" #header>{{ i18n.ts._widgets.birthdayFollowings }}</template>
	<template v-else #header>{{ i18n.ts._widgets.birthdaySoon }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="fetch(true)"><i class="ti ti-refresh"></i></button></template>

	<MkPagination ref="paginationEl" :pagination="birthdayUsersPagination">
		<template #empty>
			<div :class="$style.empty" :style="`height: ${widgetProps.showHeader ? widgetProps.height - 38 : widgetProps.height}px;`">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</template>

		<template #default="{ items: users }">
			<MkDateSeparatedList v-slot="{ item }" :items="toMisskeyEntity(users)" :noGap="true">
				<div v-if="item.user" :key="item.id" style="display: grid; grid-template-columns: auto 56px; grid-column-gap: 8px;">
					<MkA :to="userPage(item.user)" style="overflow: hidden;">
						<MkUserCardMini :user="item.user" :withChart="false" style="text-overflow: ellipsis; background: inherit; border-radius: unset;"/>
					</MkA>
					<div style="display: flex; margin-right: 16px;">
						<button v-tooltip.noDelay="i18n.ts.note" class="_button" :class="$style.post" @click="os.post({initialText: `@${item.user.username}${item.user.host ? `@${item.user.host}` : ''} `})">
							<i class="ti-fw ti ti-confetti" :class="$style.postIcon"></i>
						</button>
					</div>
				</div>
			</MkDateSeparatedList>
		</template>
	</MkPagination>
</MkContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { MisskeyEntity } from '@/types/date-separated-list.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { userPage } from '@/filters/user.js';
import { infoImageUrl } from '@/instance.js';
import { GetFormResultType } from '@/scripts/form.js';
import { useInterval } from '@/scripts/use-interval.js';
import MkContainer from '@/components/MkContainer.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';

const name = i18n.ts._widgets.birthdaySoon;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 300,
	},
	period: {
		type: 'radio' as const,
		default: 'today',
		options: [{
			value: 'today', label: i18n.ts.today,
		}, {
			value: '3day', label: i18n.tsx.dayX({ day: 3 }),
		}, {
			value: 'week', label: i18n.ts.oneWeek,
		}, {
			value: 'month', label: i18n.ts.oneMonth,
		}],
	},
};

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

const paginationEl = ref<InstanceType<typeof MkPagination>>();
const birthdayUsersPagination = {
	endpoint: 'users/get-following-birthday-users' as const,
	limit: 18,
	offsetMode: true,
	params: computed(() => {
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
};

function fetch(force = false) {
	const now = new Date();
	if (force || now.getDate() !== begin.value.getDate()) {
		// computed() で再評価されるので、paginationEl.value!.reload() は不要
		begin.value = now;
	}
}

function toMisskeyEntity(items): MisskeyEntity[] {
	const r = items.map((item: { userId: string, birthday: string, user: Misskey.entities.UserLite }) => ({
		id: item.user.id,
		createdAt: item.birthday,
		user: item.user,
	}));

	return [{ id: '_', createdAt: begin.value.toISOString() }, ...r];
}

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.empty {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	> img {
		height: 96px;
		width: auto;
		max-width: 90%;
		margin-bottom: 8px;
		border-radius: var(--radius);
	}
}

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
