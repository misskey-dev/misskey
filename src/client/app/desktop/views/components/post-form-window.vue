<template>
<mk-window class="mk-post-form-window" ref="window" is-modal @closed="onWindowClosed" :animation="animation">
	<template #header>
		<span class="mk-post-form-window--header">
			<span class="icon" v-if="geo"><fa icon="map-marker-alt"/></span>
			<span v-if="!reply">{{ $t('note') }}</span>
			<span v-if="reply">{{ $t('reply') }}</span>
			<span class="count" v-if="files.length != 0">{{ $t('attaches').replace('{}', files.length) }}</span>
			<span class="count" v-if="uploadings.length != 0">{{ $t('uploading-media').replace('{}', uploadings.length) }}<mk-ellipsis/></span>
		</span>
	</template>

	<div class="mk-post-form-window--body" :style="{ maxHeight: `${maxHeight}px` }">
		<mk-note-preview v-if="reply" class="notePreview" :note="reply"/>
		<x-post-form ref="form"
			:reply="reply"
			:mention="mention"
			@posted="onPosted"
			@change-uploadings="onChangeUploadings"
			@change-attached-files="onChangeFiles"
			@geo-attached="onGeoAttached"
			@geo-dettached="onGeoDettached"/>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XPostForm from './post-form.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/post-form-window.vue'),

	components: {
		XPostForm
	},

	props: {
		reply: {
			type: Object,
			required: false
		},
		mention: {
			type: Object,
			required: false
		},

		animation: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	data() {
		return {
			uploadings: [],
			files: [],
			geo: null
		};
	},

	computed: {
		maxHeight() {
			return window.innerHeight - 50;
		},
	},

	mounted() {
		this.$nextTick(() => {
			(this.$refs.form as any).focus();
		});
	},

	methods: {
		onChangeUploadings(files) {
			this.uploadings = files;
		},
		onChangeFiles(files) {
			this.files = files;
		},
		onGeoAttached(geo) {
			this.geo = geo;
		},
		onGeoDettached() {
			this.geo = null;
		},
		onPosted() {
			(this.$refs.window as any).close();
		},
		onWindowClosed() {
			this.$emit('closed');
			this.destroyDom();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-post-form-window
	.mk-post-form-window--header
		.icon
			margin-right 8px

		.count
			margin-left 8px
			opacity 0.8

			&:before
				content '('

			&:after
				content ')'

	.mk-post-form-window--body
		.notePreview
				margin 16px 22px

</style>
