<template>
<div>
	<portal to="header"><fa :icon="faCog"/>{{ $t('accountSettings') }}</portal>

	<x-profile-setting class="_vMargin"/>
	<x-privacy-setting class="_vMargin"/>
	<x-reaction-setting class="_vMargin"/>

	<section class="_card _vMargin">
		<div class="_title"><fa :icon="faCog"/> {{ $t('general') }}</div>
		<div class="_content">
			<mk-switch v-model:value="$store.state.i.autoWatch" @change="onChangeAutoWatch">
				{{ $t('autoNoteWatch') }}<template #desc>{{ $t('autoNoteWatchDescription') }}</template>
			</mk-switch>
			<mk-switch v-model:value="$store.state.i.injectFeaturedNote" @change="onChangeInjectFeaturedNote">
				{{ $t('showFeaturedNotesInTimeline') }}
			</mk-switch>
		</div>
		<div class="_content">
			<mk-button @click="readAllNotifications">{{ $t('markAsReadAllNotifications') }}</mk-button>
			<mk-button @click="readAllUnreadNotes">{{ $t('markAsReadAllUnreadNotes') }}</mk-button>
			<mk-button @click="readAllMessagingMessages">{{ $t('markAsReadAllTalkMessages') }}</mk-button>
		</div>
		<div class="_content">
			<mk-button @click="configure">{{ $t('notificationSetting') }}</mk-button>
		</div>
	</section>

	<x-import-export class="_vMargin"/>
	<x-drive class="_vMargin"/>
	<x-mute-block class="_vMargin"/>
	<x-word-mute class="_vMargin"/>
	<x-security class="_vMargin"/>
	<x-2fa class="_vMargin"/>
	<x-integration class="_vMargin"/>
	<x-api class="_vMargin"/>

	<router-link class="_panel _buttonPrimary" to="/my/apps" style="margin: var(--margin) auto;">{{ $t('installedApps') }}</router-link>

	<button class="_panel _buttonPrimary" @click="$root.signout()" style="margin: var(--margin) auto;">{{ $t('logout') }}</button>
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
import MkButton from '../../components/ui/button.vue';
import MkSwitch from '../../components/ui/switch.vue';

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
			this.$root.api('i/update', {
				autoWatch: v
			});
		},

		onChangeInjectFeaturedNote(v) {
			this.$root.api('i/update', {
				injectFeaturedNote: v
			});
		},

		readAllUnreadNotes() {
			this.$root.api('i/read-all-unread-notes');
		},

		readAllMessagingMessages() {
			this.$root.api('i/read-all-messaging-messages');
		},

		readAllNotifications() {
			this.$root.api('notifications/mark-all-as-read');
		},

		async configure() {
			this.$root.new(await import('../../components/notification-setting-window.vue'), {
				includingTypes: this.$store.state.i.includingNotificationTypes,
				showGlobalToggle: false,
			}).$on('ok', async ({ includingTypes: value }: any) => {
				await this.$root.api('i/update', {
					includingNotificationTypes: value,
				}).then(i => {
					this.$store.state.i.includingNotificationTypes = i.includingNotificationTypes;
				}).catch(err => {
					this.$store.dispatch('showDialog', {
						type: 'error',
						text: err.message
					});
				});
			});
		}
	}
});
</script>
