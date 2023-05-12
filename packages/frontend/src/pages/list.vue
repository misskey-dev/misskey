<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MKSpacer v-if="!(typeof error === 'undefined')" :content-max="1200">
		<div :class="$style.root">
			<img :class="$style.img" src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
			<p :class="$style.text">
				<i class="ti ti-alert-triangle"></i>
				{{ i18n.ts.somethingHappened }}
			</p>
		</div>
	</MKSpacer>
	<MkSpacer :content-max="700" :class="$style.main">
		<div v-if="list" class="members _margin">
			<div :class="$style.member_text">{{ i18n.ts.members }}</div>
			<div class="_gaps_s">
				<div v-for="user in users" :key="user.id" :class="$style.userItem">
					<MkA :class="$style.userItemBody" :to="`${userPage(user)}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</div>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch, computed } from 'vue';
import * as os from '@/os';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	listId: string;
}>();

let list = $ref(null);
let error = $ref();
let users = $ref([]);

function fetchList(): void {
	os.api('users/lists/public-show', {
		listId: props.listId,
	}).then(_list => {
		list = _list;
		os.api('users/show', {
			userIds: list.userIds,
		}).then(_users => {
			users = _users;
		});
	}).catch(err => {
		error = err;
	});
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => list ? {
	title: list.name,
	icon: 'ti ti-list',
} : null));
</script>
<style lang="scss" module>
.main {
	min-height: calc(100cqh - (var(--stickyTop, 0px) + var(--stickyBottom, 0px)));
}

.userItem {
	display: flex;
}

.userItemBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}
.member_text {
	margin: 5px;
}

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
