<template>
<mk-ui>
	<span slot="header">
		<template v-if="folder">%fa:R folder-open%{{ folder.name }}</template>
		<template v-if="file"><mk-file-type-icon data-icon :type="file.type"/>{{ file.name }}</template>
		<template v-if="!folder && !file">%fa:cloud%%i18n:mobile.tags.mk-drive-page.drive%</template>
	</span>
	<template slot="func"><button @click="fn">%fa:ellipsis-h%</button></template>
	<mk-drive
		ref="browser"
		:init-folder="initFolder"
		:init-file="initFile"
		:is-naked="true"
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
			file: null,
			initFolder: null,
			initFile: null
		};
	},
	created() {
		this.initFolder = this.$route.params.folder;
		this.initFile = this.$route.params.file;

		window.addEventListener('popstate', this.onPopState);
	},
	mounted() {
		document.title = 'Misskey Drive';
		document.documentElement.style.background = '#fff';
	},
	beforeDestroy() {
		window.removeEventListener('popstate', this.onPopState);
	},
	methods: {
		onPopState() {
			if (this.$route.params.folder) {
				(this.$refs as any).browser.cd(this.$route.params.folder, true);
			} else if (this.$route.params.file) {
				(this.$refs as any).browser.cf(this.$route.params.file, true);
			} else {
				(this.$refs as any).browser.goRoot(true);
			}
		},
		fn() {
			(this.$refs as any).browser.openContextMenu();
		},
		onMoveRoot(silent) {
			const title = 'Misskey Drive';

			if (!silent) {
				// Rewrite URL
				history.pushState(null, title, '/i/drive');
			}

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

