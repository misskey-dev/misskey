<template>
<mk-ui :func="fn">
	<span slot="header">
		<template v-if="folder">%fa:R folder-open%{{ folder.name }}</template>
		<template v-if="file"><mk-file-type-icon class="icon"/>{{ file.name }}</template>
		<template v-else>%fa:cloud%%i18n:mobile.tags.mk-drive-page.drive%</template>
	</span>
	<template slot="funcIcon">%fa:ellipsis-h%</template>
	<mk-drive
		ref="browser"
		:init-folder="folder"
		:init-file="file"
		is-naked
		:top="48"
		@begin-fetch="Progress.start()"
		@fetched-mid="Progress.set(0.5)"
		@fetched="Progress.done()"
		@move-root="onMoveRoot"
		@open-folder="onOpenFolder"
		@open-file="onOpenFile"
	/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			Progress,
			folder: null,
			file: null
		};
	},
	mounted() {
		document.title = 'Misskey Drive';
	},
	methods: {
		fn() {
			(this.$refs as any).browser.openContextMenu();
		},
		onMoveRoot() {
			const title = 'Misskey Drive';

			// Rewrite URL
			history.pushState(null, title, '/i/drive');

			document.title = title;

			this.file = null;
			this.folder = null;
		},
		onOpenFolder(folder, silent) {
			const title = folder.name + ' | Misskey Drive';

			if (!silent) {
				// Rewrite URL
				history.pushState(null, title, '/i/drive/folder/' + folder.id);
			}

			document.title = title;

			this.file = null;
			this.folder = folder;
		},
		onOpenFile(file, silent) {
			const title = file.name + ' | Misskey Drive';

			if (!silent) {
				// Rewrite URL
				history.pushState(null, title, '/i/drive/file/' + file.id);
			}

			document.title = title;

			this.file = file;
			this.folder = null;
		}
	}
});
</script>

