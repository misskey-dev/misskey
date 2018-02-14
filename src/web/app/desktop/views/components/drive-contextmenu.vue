<template>
<mk-contextmenu ref="menu" @closed="onClosed">
	<ul>
		<li @click="createFolder">
			<p>%fa:R folder%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.create-folder%</p>
		</li>
		<li @click="upload">
			<p>%fa:upload%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.upload%</p>
		</li>
		<li @click="urlUpload">
			<p>%fa:cloud-upload-alt%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.url-upload%</p>
		</li>
	</ul>
</mk-contextmenu>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['browser'],
	mounted() {

	},
	methods: {
		close() {
			(this.$refs.menu as any).close();
		},
		onClosed() {
			this.$emit('closed');
			this.$destroy();
		},
		createFolder() {
			this.browser.createFolder();
			this.close();
		},
		upload() {
			this.browser.selectLocalFile();
			this.close();
		},
		urlUpload() {
			this.browser.urlUpload();
			this.close();
		}
	}
});
</script>
