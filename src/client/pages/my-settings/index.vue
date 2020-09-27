<template>
<div>
	<portal to="header"><Fa :icon="faCog"/>{{ $t('accountSettings') }}</portal>

	<XProfileSetting class="_vMargin"/>
	<XPrivacySetting class="_vMargin"/>
	<XReactionSetting class="_vMargin"/>

	<section class="_section">
		<div class="_title"><Fa :icon="faCog"/> {{ $t('general') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="$store.state.i.autoWatch" @update:value="onChangeAutoWatch">
				{{ $t('autoNoteWatch') }}<template #desc>{{ $t('autoNoteWatchDescription') }}</template>
			</MkSwitch>
			<MkSwitch v-model:value="$store.state.i.injectFeaturedNote" @update:value="onChangeInjectFeaturedNote">
				{{ $t('showFeaturedNotesInTimeline') }}
			</MkSwitch>
		</div>
		<div class="_content">
			<MkButton @click="readAllNotifications">{{ $t('markAsReadAllNotifications') }}</MkButton>
			<MkButton @click="readAllUnreadNotes">{{ $t('markAsReadAllUnreadNotes') }}</MkButton>
			<MkButton @click="readAllMessagingMessages">{{ $t('markAsReadAllTalkMessages') }}</MkButton>
		</div>
		<div class="_content">
			<MkButton @click="configure">{{ $t('notificationSetting') }}</MkButton>
		</div>
	</section>

	<XImportExport class="_vMargin"/>
	<XDrive class="_vMargin"/>
	<XMuteBlock class="_vMargin"/>
	<XWordMute class="_vMargin"/>
	<XSecurity class="_vMargin"/>
	<x-2fa class="_vMargin"/>
	<XIntegration class="_vMargin"/>
	<XApi class="_vMargin"/>

	<router-link class="_panel _buttonPrimary" to="/my/apps" style="margin: var(--margin) auto;">{{ $t('installedApps') }}</router-link>

	<button class="_panel _buttonPrimary" @click="signout()" style="margin: var(--margin) auto;">{{ $t('logout') }}</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import XProfileSetting from './profile.vue';
import XPrivacySetting from './privacy.vue';
import XImportExport from './import-export.vue';
import XDrive from './drive.vue';
import XReactionSetting from './reaction.vue';
import XMuteBlock from './mute-block.vue';
import XWordMute from './word-mute.vue';
import XSecurity from './security.vue';
import X2fa from './2fa.vue';
import XIntegration from './integration.vue';
import XApi from './api.vue';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import * as os from '@/os';
import { notificationTypes } from '../../../types';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('settings') as string
		};
	},

	components: {
		XProfileSetting,
		XPrivacySetting,
		XImportExport,
		XDrive,
		XReactionSetting,
		XMuteBlock,
		XWordMute,
		XSecurity,
		X2fa,
		XIntegration,
		XApi,
		MkButton,
		MkSwitch,
	},

	data() {
		return {
			faCog
		}
	},

	methods: {
		onChangeAutoWatch(v) {
			os.api('i/update', {
				autoWatch: v
			});
		},

		onChangeInjectFeaturedNote(v) {
			os.api('i/update', {
				injectFeaturedNote: v
			});
		},

		readAllUnreadNotes() {
			os.api('i/read-all-unread-notes');
		},

		readAllMessagingMessages() {
			os.api('i/read-all-messaging-messages');
		},

		readAllNotifications() {
			os.api('notifications/mark-all-as-read');
		},

		async configure() {
			const includingTypes = notificationTypes.filter(x => !this.$store.state.i.mutingNotificationTypes.includes(x));
			os.modal(await import('@/components/notification-setting-window.vue'), {
				includingTypes,
				showGlobalToggle: false,
			}).then(async (res) => {
				if (res == null) return;
				const { includingTypes: value } = res;
				await os.api('i/update', {
					mutingNotificationTypes: notificationTypes.filter(x => !value.includes(x)),
				}).then(i => {
					this.$store.state.i.mutingNotificationTypes = i.mutingNotificationTypes;
				}).catch(err => {
					os.dialog({
						type: 'error',
						text: err.message
					});
				});
			});
		},

		signout() {
			this.$store.dispatch('logout');
			location.href = '/';
		}
	}
});
</script>
