<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-bdayfollowings">
	<template #icon><i class="ti ti-cake"></i></template>
	<template #header>{{ i18n.ts._widgets.birthdayFollowings }}</template>

	<div :class="$style.bdayFRoot">
		<MkLoading v-if="fetching"/>
		<div v-else-if="users.length > 0" :class="$style.bdayFGrid">
			<MkAvatar v-for="user in users" :key="user.id" :user="user.followee" link preview></MkAvatar>
		</div>
		<div v-else :class="$style.bdayFFallback">
			<img :src="infoImageUrl" class="_ghost" :class="$style.bdayFFallbackImage"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useInterval } from '@/scripts/use-interval.js';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { $i } from '@/account.js';

const name = i18n.ts._widgets.birthdayFollowings;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const users = ref<Misskey.entities.FollowingFolloweePopulated[]>([]);
const fetching = ref(true);
let lastFetchedAt = '1970-01-01';

const fetch = () => {
	if (!$i) {
		users.value = [];
		fetching.value = false;
		return;
	}

	const lfAtD = new Date(lastFetchedAt);
	lfAtD.setHours(0, 0, 0, 0);
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	if (now > lfAtD) {
		misskeyApi('users/following', {
			limit: 18,
			birthday: now.toISOString(),
			userId: $i.id,
		}).then(res => {
			users.value = res;
			fetching.value = false;
		});

		lastFetchedAt = now.toISOString();
	}
};

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
.bdayFRoot {
	overflow: hidden;
	min-height: calc(calc(calc(50px * 3) - 8px) + calc(var(--margin) * 2));
}
.bdayFGrid {
	display: grid;
	grid-template-columns: repeat(6, 42px);
	grid-template-rows: repeat(3, 42px);
	place-content: center;
	gap: 8px;
	margin: var(--margin) auto;
}

.bdayFFallback {
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.bdayFFallbackImage {
	height: 96px;
	width: auto;
	max-width: 90%;
	margin-bottom: 8px;
	border-radius: var(--radius);
}
</style>
