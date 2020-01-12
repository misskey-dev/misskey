<template>
<div class="mk-settings-page">
	<portal to="icon"><fa :icon="faCog"/></portal>
	<portal to="title">{{ $t('settings') }}</portal>

	<x-profile-setting/>
	<x-privacy-setting/>
	<x-reaction-setting/>
	<x-import-export/>
	<x-drive/>
	<x-general/>
	<x-mute-block/>
	<x-security/>

	<x-button @click="$root.signout()" primary class="logout">{{ $t('logout') }}</x-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import XProfileSetting from './settings.profile.vue';
import XPrivacySetting from './settings.privacy.vue';
import XImportExport from './settings.import-export.vue';
import XDrive from './settings.drive.vue';
import XGeneral from './settings.general.vue';
import XReactionSetting from './settings.reaction.vue';
import XMuteBlock from './settings.mute-block.vue';
import XSecurity from './settings.security.vue';
import XButton from '../components/ui/button.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('settings')
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
		XButton,
	},

	data() {
		return {
			faCog
		}
	},
});
</script>

<style lang="scss" scoped>
.mk-settings-page {
	> .logout {
		margin: 8px auto;
	}
}
</style>
