<template>
<div class="mk-settings-page">
	<portal to="icon"><fa :icon="faCog"/></portal>
	<portal to="title">{{ $t('settings') }}</portal>

	<x-profile-setting/>
	<x-privacy-setting/>
	<x-reaction-setting/>
	<x-theme/>
	<x-import-export/>
	<x-drive/>
	<x-general/>
	<x-mute-block/>
	<x-security/>
	<x-2fa/>
	<x-integration/>
	<x-api/>

	<mk-button @click="cacheClear()" primary class="cacheClear">{{ $t('cacheClear') }}</mk-button>
	<mk-button @click="$root.signout()" primary class="logout">{{ $t('logout') }}</mk-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import XProfileSetting from './profile.vue';
import XPrivacySetting from './privacy.vue';
import XImportExport from './import-export.vue';
import XDrive from './drive.vue';
import XGeneral from './general.vue';
import XReactionSetting from './reaction.vue';
import XMuteBlock from './mute-block.vue';
import XSecurity from './security.vue';
import XTheme from './theme.vue';
import X2fa from './2fa.vue';
import XIntegration from './integration.vue';
import XApi from './api.vue';
import MkButton from '../../components/ui/button.vue';

export default Vue.extend({
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
		XGeneral,
		XReactionSetting,
		XMuteBlock,
		XSecurity,
		XTheme,
		X2fa,
		XIntegration,
		XApi,
		MkButton,
	},

	data() {
		return {
			faCog
		}
	},

	methods: {
		cacheClear() {
			// Clear cache (service worker)
			try {
				navigator.serviceWorker.controller.postMessage('clear');

				navigator.serviceWorker.getRegistrations().then(registrations => {
					for (const registration of registrations) registration.unregister();
				});
			} catch (e) {
				console.error(e);
			}

			// Force reload
			location.reload(true);
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-settings-page {
	> .logout,
	> .cacheClear {
		margin: 8px auto;
	}
}
</style>
