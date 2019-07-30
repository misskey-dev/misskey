<template>
<div class="skeikyzd" v-show="files.length != 0">
	<x-draggable class="files" :list="files" animation="150">
		<div v-for="file in files" :key="file.id" @click="showFileMenu(file, $event)" @contextmenu.prevent="showFileMenu(file, $event)">
			<x-file-thumbnail :data-id="file.id" class="thumbnail" :file="file" fit="cover"/>
			<img class="remove" @click.stop="detachMedia(file.id)" src="/assets/desktop/remove.png" :title="$t('attach-cancel')" alt=""/>
			<div class="sensitive" v-if="file.isSensitive">
				<fa class="icon" :icon="faExclamationTriangle"/>
			</div>
		</div>
	</x-draggable>
	<p class="remain">{{ 4 - files.length }}/4</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as XDraggable from 'vuedraggable';
import XMenu from '../../../common/views/components/menu.vue';
import { faTimesCircle, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import XFileThumbnail from './drive-file-thumbnail.vue'

export default Vue.extend({
	i18n: i18n('common/views/components/post-form-attaches.vue'),

	components: {
		XDraggable,
		XFileThumbnail
	},

	props: {
		files: {
			type: Array,
			required: true
		},
		detachMediaFn: {
			type: Function,
			required: false
		}
	},

	data() {
		return {
			faExclamationTriangle
		};
	},

	methods: {
		detachMedia(id) {
			if (this.detachMediaFn) this.detachMediaFn(id)
			else if (this.$parent.detachMedia) this.$parent.detachMedia(id)
		},
		toggleSensitive(file) {
			this.$root.api('drive/files/update', {
				fileId: file.id,
				isSensitive: !file.isSensitive
			}).then(() => {
				file.isSensitive = !file.isSensitive;
			});
		},
		showFileMenu(file, ev: MouseEvent) {
			this.$root.new(XMenu, {
				items: [{
					type: 'item',
					text: file.isSensitive ? this.$t('unmark-as-sensitive') : this.$t('mark-as-sensitive'),
					icon: file.isSensitive ? faEyeSlash : faEye,
					action: () => { this.toggleSensitive(file) }
				}, {
					type: 'item',
					text: this.$t('attach-cancel'),
					icon: faTimesCircle,
					action: () => { this.detachMedia(file.id) }
				}],
				source: ev.currentTarget || ev.target
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.skeikyzd
	padding 4px

	> .files
		display flex
		flex-wrap wrap

		> div
			width 64px
			height 64px
			margin 4px
			cursor move

			&:hover > .remove
				display block

			> .thumbnail
				width 100%
				height 100%
				z-index 1
				color var(--text)

			> .remove
				display none
				position absolute
				top -6px
				right -6px
				width 16px
				height 16px
				cursor pointer
				z-index 1000

			> .sensitive
				display flex
				position absolute
				width 64px
				height 64px
				top 0
				left 0
				z-index 2
				background rgba(17, 17, 17, .7)
				color #fff

				> .icon
					margin auto

	> .remain
		display block
		position absolute
		top 8px
		right 8px
		margin 0
		padding 0
		color var(--primaryAlpha04)

</style>
