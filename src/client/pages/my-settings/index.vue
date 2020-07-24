<template>
<div>
	<portal to="icon"><fa :icon="faCog"/></portal>
	<portal to="title" v-t="'accountSettings'"></portal>

	<x-profile-setting/>
	<x-privacy-setting/>
	<x-reaction-setting/>

	<section class="_card">
		<div class="_title"><fa :icon="faCog"/> {{ $t('general') }}</div>
		<div class="_content">
			<mk-switch v-model="$store.state.i.autoWatch" @change="onChangeAutoWatch">
				{{ $t('autoNoteWatch') }}<template #desc>{{ $t('autoNoteWatchDescription') }}</template>
			</mk-switch>
			<mk-switch v-model="$store.state.i.injectFeaturedNote" @change="onChangeInjectFeaturedNote">
				{{ $t('showFeaturedNotesInTimeline') }}
			</mk-switch>
		</div>
		<div class="_content">
			<mk-button @click="readAllNotifications" v-t="'markAsReadAllNotifications'"></mk-button>
			<mk-button @click="readAllUnreadNotes" v-t="'markAsReadAllUnreadNotes'"></mk-button>
			<mk-button @click="readAllMessagingMessages" v-t="'markAsReadAllTalkMessages'"></mk-button>
		</div>
	</section>

	<x-import-export/>
	<x-drive/>
	<x-mute-block/>
	<x-security/>
	<x-2fa/>
	<x-integration/>
	<x-api/>

	<router-link class="_panel _buttonPrimary" to="/my/apps" style="margin: var(--margin) auto;" v-t="'installedApps'"></router-link>

	<button class="_panel _buttonPrimary" @click="$root.signout()" style="margin: var(--margin) auto;" v-t="'logout'"></button>
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
	}
});
</script>
