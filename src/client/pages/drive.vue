<template>
<div>
	<portal to="header">
		<button @click="menu" class="_button _jmoebdiw_">
			<fa :icon="faCloud" style="margin-right: 8px;"/>
			<span>{{ $t('drive') }}</span>
			<fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
		</button>
	</portal>
	<x-drive ref="drive"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCloud, faAngleDown, faAngleUp, faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import XDrive from '../components/drive.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('drive') as string
		};
	},

	components: {
		XDrive
	},

	data() {
		return {
			menuOpened: false,
			faCloud, faAngleDown, faAngleUp
		};
	},

	methods: {
		menu(ev) {
			this.menuOpened = true;
			this.$root.menu({
				items: [{
					text: this.$t('createFolder'),
					icon: faFolderPlus,
					action: () => { this.$refs.drive.createFolder(); }
				}],
				source: ev.currentTarget || ev.target
			}).then(() => {
				this.menuOpened = false;
			});
		}
	}
});
</script>

<style lang="scss">
._jmoebdiw_ {
	height: 100%;
	padding: 0 16px;
	font-weight: bold;
}
</style>
