<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs"/></template>
	<MKSpacer v-if="!(typeof error === 'undefined')" :contentMax="1200">
		<div :class="$style.root">
			<img :class="$style.img" :src="serverErrorImageUrl" class="_ghost"/>
			<p :class="$style.text">
				<i class="ti ti-alert-triangle"></i>
				{{ error }}
			</p>
		</div>
	</MKSpacer>
	<MkSpacer v-else-if="tab === 'users'" :contentMax="1200">
		<div class="_gaps_s">
			<div v-if="role">{{ role.description }}</div>
			<MkUserList v-if="visible" :pagination="users" :extractor="(item) => item.user"/>
			<div v-else-if="!visible" class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'timeline'" :contentMax="700">
		<MkTimeline v-if="visible" ref="timeline" src="role" :role="props.role"/>
		<div v-else-if="!visible" class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkUserList from '@/components/MkUserList.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import MkTimeline from '@/components/MkTimeline.vue';
import { instanceName } from '@/config.js';
import { serverErrorImageUrl, infoImageUrl } from '@/instance.js';

const props = withDefaults(defineProps<{
	role: string;
	initialTab?: string;
}>(), {
	initialTab: 'users',
});

const tab = ref(props.initialTab);
const role = ref<Misskey.entities.Role>();
const error = ref();
const visible = ref(false);

watch(() => props.role, () => {
	misskeyApi('roles/show', {
		roleId: props.role,
	}).then(res => {
		role.value = res;
		document.title = `${role.value.name} | ${instanceName}`;
		visible.value = res.isExplorable && res.isPublic;
	}).catch((err) => {
		if (err.code === 'NO_SUCH_ROLE') {
			error.value = i18n.ts.noRole;
		} else {
			error.value = i18n.ts.somethingHappened;
		}
		document.title = `${error.value} | ${instanceName}`;
	});
}, { immediate: true });

const users = computed(() => ({
	endpoint: 'roles/users' as const,
	limit: 30,
	params: {
		roleId: props.role,
	},
}));

const headerTabs = computed(() => [{
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}, {
	key: 'timeline',
	icon: 'ti ti-pencil',
	title: i18n.ts.timeline,
}]);

definePageMetadata(() => ({
	title: role.value ? role.value.name : i18n.ts.role,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
  align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.img {
	vertical-align: bottom;
  width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}
</style>

