<template>
<mk-window ref="window" is-modal @closed="$destroy">
	<span slot="header">
		<span v-if="!parent.opts.reply">%i18n:desktop.tags.mk-post-form-window.post%</span>
		<span v-if="parent.opts.reply">%i18n:desktop.tags.mk-post-form-window.reply%</span>
		<span :class="$style.files" v-if="parent.files.length != 0">{ '%i18n:desktop.tags.mk-post-form-window.attaches%'.replace('{}', parent.files.length) }</span>
		<span :class="$style.files" v-if="parent.uploadingFiles.length != 0">{ '%i18n:desktop.tags.mk-post-form-window.uploading-media%'.replace('{}', parent.uploadingFiles.length) }<mk-ellipsis/></span>
	</span>
	<div slot="content">
		<div class="ref" v-if="parent.opts.reply">
			<mk-post-preview :class="$style.postPreview" :post="reply"/>
		</div>
		<div class="body">
			<mk-post-form ref="form"
				:reply="reply"
				@post="$refs.window.close"
				@change-uploadings="onChangeUploadings"
				@change-attached-media="onChangeMedia"/>
		</div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['reply'],
	data() {
		return {
			uploadings: [],
			media: []
		};
	},
	mounted() {
		(this.$refs.form as any).focus();
	},
	methods: {
		onChangeUploadings(media) {
			this.uploadings = media;
		},
		onChangeMedia(media) {
			this.media = media;
		}
	}
});
</script>

<style lang="stylus" module>
.files
	margin-left 8px
	opacity 0.8

	&:before
		content '('

	&:after
		content ')'

.postPreview
	margin 16px 22px

</style>
