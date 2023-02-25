<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700">
			<div class="_gaps">
				<div class="_buttons">
					<MkButton primary rounded @click="edit"><i class="ti ti-pencil"></i> {{ i18n.ts.edit }}</MkButton>
					<MkButton danger rounded @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
				</div>
				<MkFolder>
					<template #icon><i class="ti ti-info-circle"></i></template>
					<template #label>{{ i18n.ts.info }}</template>
					<XEditor :role="role" readonly/>
				</MkFolder>
				<MkFolder v-if="role.target === 'manual'" default-open>
					<template #icon><i class="ti ti-users"></i></template>
					<template #label>{{ i18n.ts.users }}</template>
					<template #suffix>{{ role.usersCount }}</template>
					<div class="_gaps">
						<MkButton primary rounded @click="assign"><i class="ti ti-plus"></i> {{ i18n.ts.assign }}</MkButton>

						<MkPagination :pagination="usersPagination">
							<template #empty>
								<div class="_fullinfo">
									<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
									<div>{{ i18n.ts.noUsers }}</div>
								</div>
							</template>

							<template #default="{ items }">
								<div class="_gaps_s">
									<div v-for="item in items" :key="item.user.id" :class="$style.userItem">
										<MkA :class="$style.user" :to="`/user-info/${item.user.id}`">
											<MkUserCardMini :user="item.user"/>
										</MkA>
										<button class="_button" :class="$style.unassign" @click="unassign(item.user, $event)"><i class="ti ti-x"></i></button>
									</div>
								</div>
							</template>
						</MkPagination>
					</div>
				</MkFolder>
				<MkInfo v-else>{{ i18n.ts._role.isConditionalRole }}</MkInfo>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import XHeader from './_header_.vue';
import XEditor from './roles.editor.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';
import MkButton from '@/components/MkButton.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

const usersPagination = {
	endpoint: 'admin/roles/users' as const,
	limit: 20,
	params: computed(() => ({
		roleId: props.id,
	})),
};

const role = reactive(await os.api('admin/roles/show', {
	roleId: props.id,
}));

function edit() {
	router.push('/admin/roles/' + role.id + '/edit');
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: role.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('admin/roles/delete', {
		roleId: role.id,
	});

	router.push('/admin/roles');
}

function assign() {
	os.selectUser({
		includeSelf: true,
	}).then(async (user) => {
		await os.apiWithDialog('admin/roles/assign', { roleId: role.id, userId: user.id });
		role.users.push(user);
	});
}

async function unassign(user, ev) {
	os.popupMenu([{
		text: i18n.ts.unassign,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			await os.apiWithDialog('admin/roles/unassign', { roleId: role.id, userId: user.id });
			role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.role + ': ' + role.name,
	icon: 'ti ti-badge',
})));
</script>

<style lang="scss" module>
.userItem {
	display: flex;
}

.user {
	flex: 1;
	min-width: 0;
}

.unassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}
</style>
