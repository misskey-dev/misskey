<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="500" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_formRoot">
				<div class="_formBlock aeakzknw">
					<MkAvatar class="avatar" :user="user" :show-indicator="true"/>
				</div>

				<FormLink :to="userPage(user)">Profile</FormLink>

				<div class="_formBlock">
					<MkKeyValue :copy="acct(user)" oneline style="margin: 1em 0;">
						<template #key>Acct</template>
						<template #value><span class="_monospace">{{ acct(user) }}</span></template>
					</MkKeyValue>

					<MkKeyValue :copy="user.id" oneline style="margin: 1em 0;">
						<template #key>ID</template>
						<template #value><span class="_monospace">{{ user.id }}</span></template>
					</MkKeyValue>
				</div>

				<FormSection v-if="iAmModerator">
					<template #label>Moderation</template>
					<FormSwitch v-if="user.host == null && $i.isAdmin && (moderator || !user.isAdmin)" v-model="moderator" class="_formBlock" @update:modelValue="toggleModerator">{{ $ts.moderator }}</FormSwitch>
					<FormSwitch v-model="silenced" class="_formBlock" @update:modelValue="toggleSilence">{{ $ts.silence }}</FormSwitch>
					<FormSwitch v-model="suspended" class="_formBlock" @update:modelValue="toggleSuspend">{{ $ts.suspend }}</FormSwitch>
					{{ $ts.reflectMayTakeTime }}
					<FormButton v-if="user.host == null && iAmModerator" class="_formBlock" @click="resetPassword"><i class="fas fa-key"></i> {{ $ts.resetPassword }}</FormButton>
				</FormSection>

				<FormSection>
					<template #label>ActivityPub</template>

					<div class="_formBlock">
						<MkKeyValue v-if="user.host" oneline style="margin: 1em 0;">
							<template #key>{{ $ts.instanceInfo }}</template>
							<template #value><MkA :to="`/instance-info/${user.host}`" class="_link">{{ user.host }} <i class="fas fa-angle-right"></i></MkA></template>
						</MkKeyValue>
						<MkKeyValue v-else oneline style="margin: 1em 0;">
							<template #key>{{ $ts.instanceInfo }}</template>
							<template #value>(Local user)</template>
						</MkKeyValue>
						<MkKeyValue oneline style="margin: 1em 0;">
							<template #key>{{ $ts.updatedAt }}</template>
							<template #value><MkTime v-if="user.lastFetchedAt" mode="detail" :time="user.lastFetchedAt"/><span v-else>N/A</span></template>
						</MkKeyValue>
						<MkKeyValue v-if="ap" oneline style="margin: 1em 0;">
							<template #key>Type</template>
							<template #value><span class="_monospace">{{ ap.type }}</span></template>
						</MkKeyValue>
					</div>

					<FormButton v-if="user.host != null" class="_formBlock" @click="updateRemoteUser"><i class="fas fa-sync"></i> {{ $ts.updateRemoteUser }}</FormButton>
				</FormSection>

				<MkObjectView v-if="info && $i.isAdmin" tall :value="info">
				</MkObjectView>

				<MkObjectView tall :value="user">
				</MkObjectView>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, defineComponent, watch } from 'vue';
import * as misskey from 'misskey-js';
import MkObjectView from '@/components/object-view.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import FormButton from '@/components/ui/button.vue';
import MkKeyValue from '@/components/key-value.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import number from '@/filters/number';
import bytes from '@/filters/bytes';
import { url } from '@/config';
import { userPage, acct } from '@/filters/user';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { iAmModerator } from '@/account';

const props = defineProps<{
	userId: string;
}>();

let user = $ref<null | misskey.entities.UserDetailed>();
let init = $ref();
let info = $ref();
let ap = $ref(null);
let moderator = $ref(false);
let silenced = $ref(false);
let suspended = $ref(false);

function createFetcher() {
	if (iAmModerator) {
		return () => Promise.all([os.api('users/show', {
			userId: props.userId,
		}), os.api('admin/show-user', {
			userId: props.userId,
		})]).then(([_user, _info]) => {
			user = _user;
			info = _info;
			moderator = info.isModerator;
			silenced = info.isSilenced;
			suspended = info.isSuspended;
		});
	} else {
		return () => os.api('users/show', {
			userId: props.userId,
		}).then((res) => {
			user = res;
		});
	}
}

function refreshUser() {
	init = createFetcher();
}

async function updateRemoteUser() {
	await os.apiWithDialog('federation/update-remote-user', { userId: user.id });
	refreshUser();
}

async function resetPassword() {
	const { password } = await os.api('admin/reset-password', {
		userId: user.id,
	});

	os.alert({
		type: 'success',
		text: i18n.t('newPasswordIs', { password }),
	});
}

async function toggleSilence(v) {
	const confirm = await os.confirm({
		type: 'warning',
		text: v ? i18n.ts.silenceConfirm : i18n.ts.unsilenceConfirm,
	});
	if (confirm.canceled) {
		silenced = !v;
	} else {
		await os.api(v ? 'admin/silence-user' : 'admin/unsilence-user', { userId: user.id });
		await refreshUser();
	}
}

async function toggleSuspend(v) {
	const confirm = await os.confirm({
		type: 'warning',
		text: v ? i18n.ts.suspendConfirm : i18n.ts.unsuspendConfirm,
	});
	if (confirm.canceled) {
		suspended = !v;
	} else {
		await os.api(v ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: user.id });
		await refreshUser();
	}
}

async function toggleModerator(v) {
	await os.api(v ? 'admin/moderators/add' : 'admin/moderators/remove', { userId: user.id });
	await refreshUser();
}

async function deleteAllFiles() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteAllFilesConfirm,
	});
	if (confirm.canceled) return;
	const process = async () => {
		await os.api('admin/delete-all-files-of-a-user', { userId: user.id });
		os.success();
	};
	await process().catch(err => {
		os.alert({
			type: 'error',
			text: err.toString(),
		});
	});
	await refreshUser();
}

watch(() => props.userId, () => {
	init = createFetcher();
}, {
	immediate: true,
});

watch(() => user, () => {
	os.api('ap/get', {
		uri: user.uri || `${url}/users/${user.id}`,
	}).then(res => {
		ap = res;
	});
});

const headerActions = $computed(() => user && user.url ? [{
	text: user.url,
	icon: 'fas fa-external-link-alt',
	handler: () => {
		window.open(user.url, '_blank');
	},
}] : []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: user ? acct(user) : i18n.ts.userInfo,
	icon: 'fas fa-info-circle',
	bg: 'var(--bg)',
})));
</script>

<style lang="scss" scoped>
.aeakzknw {
	> .avatar {
		display: block;
		width: 64px;
		height: 64px;
	}
}
</style>
