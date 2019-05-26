<template>
<div class="mk-drive-page">
	<x-drive :init-folder="folder" @move-root="onMoveRoot" @open-folder="onOpenFolder"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/drive.vue'),
	components: {
		XDrive: () => import('../components/drive.vue').then(m => m.default),
	},
	data() {
		return {
			folder: null
		};
	},
	created() {
		this.folder = this.$route.params.folder;
	},
	mounted() {
		document.title = this.$t('title');
	},
	methods: {
		onMoveRoot() {
			const title = this.$t('title');

			// Rewrite URL
			history.pushState(null, title, '/i/drive');

			document.title = title;
		},
		onOpenFolder(folder) {
			const title = `${folder.name} | ${this.$t('title')}`;

			// Rewrite URL
			history.pushState(null, title, `/i/drive/folder/${folder.id}`);

			document.title = title;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-drive-page
	position fixed
	width 100%
	height 100%
	background #fff

	> .mk-drive
		height 100%
</style>
