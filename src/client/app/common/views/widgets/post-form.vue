<template>
<div>
	<ui-container :show-header="props.design == 0">
		<template #header><fa icon="pencil-alt"/>{{ $t('title') }}</template>

		<div class="lhcuptdmcdkfwmipgazeawoiuxpzaclc-body"
			@dragover.stop="onDragover"
			@drop.stop="onDrop"
		>
			<div class="textarea">
				<textarea
					:disabled="posting"
					v-model="text"
					@keydown="onKeydown"
					@paste="onPaste"
					:placeholder="placeholder"
					ref="text"
					v-autocomplete="{ model: 'text' }"
				></textarea>
				<button class="emoji" @click="emoji" ref="emoji" v-if="!$root.isMobile">
					<fa :icon="['far', 'laugh']"/>
				</button>
			</div>
			<div class="files" v-show="files.length != 0">
				<x-draggable :list="files" :options="{ animation: 150 }">
					<div v-for="file in files" :key="file.id">
						<div class="img" :style="{ backgroundImage: `url(${file.thumbnailUrl})` }" :title="file.name"></div>
						<img class="remove" @click="detachMedia(file.id)" src="/assets/desktop/remove.png" :title="$t('attach-cancel')" alt=""/>
					</div>
				</x-draggable>
			</div>
			<input ref="file" type="file" multiple="multiple" tabindex="-1" @change="onChangeFile"/>
			<mk-uploader ref="uploader" @uploaded="attachMedia"/>
			<footer>
				<button @click="chooseFile"><fa icon="upload"/></button>
				<button @click="chooseFileFromDrive"><fa icon="cloud"/></button>
				<button @click="post" :disabled="posting" class="post">{{ $t('note') }}</button>
			</footer>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import insertTextAtCursor from 'insert-text-at-cursor';
import * as XDraggable from 'vuedraggable';

export default define({
	name: 'post-form',
	props: () => ({
		design: 0
	})
}).extend({
	i18n: i18n('desktop/views/widgets/post-form.vue'),

	components: {
		XDraggable
	},

	data() {
		return {
			posting: false,
			text: '',
			files: [],
		};
	},

	computed: {
		placeholder(): string {
			const xs = [
				this.$t('@.note-placeholders.a'),
				this.$t('@.note-placeholders.b'),
				this.$t('@.note-placeholders.c'),
				this.$t('@.note-placeholders.d'),
				this.$t('@.note-placeholders.e'),
				this.$t('@.note-placeholders.f')
			];
			return xs[Math.floor(Math.random() * xs.length)];
		}
	},

	methods: {
		func() {
			if (this.props.design == 1) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		},

		chooseFile() {
			(this.$refs.file as any).click();
		},

		chooseFileFromDrive() {
			this.$chooseDriveFile({
				multiple: true
			}).then(files => {
				for (const x of files) this.attachMedia(x);
			});
		},

		attachMedia(driveFile) {
			this.files.push(driveFile);
			this.$emit('change-attached-files', this.files);
		},

		detachMedia(id) {
			this.files = this.files.filter(x => x.id != id);
			this.$emit('change-attached-files', this.files);
		},

		onKeydown(e) {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey) && !this.posting && this.text) this.post();
		},

		onPaste(e) {
			for (const item of Array.from(e.clipboardData.items)) {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			}
		},

		onChangeFile() {
			for (const x of Array.from((this.$refs.file as any).files)) this.upload(x);
		},

		upload(file) {
			(this.$refs.uploader as any).upload(file);
		},

		onDragover(e) {
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == 'mk_drive_file';
			if (isFile || isDriveFile) {
				e.preventDefault();
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
			}
		},

		onDrop(e): void {
			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				e.preventDefault();
				for (const x of Array.from(e.dataTransfer.files)) this.upload(x);
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.files.push(file);
				e.preventDefault();
			}
			//#endregion
		},

		async emoji() {
			const Picker = await import('../../../desktop/views/components/emoji-picker-dialog.vue').then(m => m.default);
			const button = this.$refs.emoji;
			const rect = button.getBoundingClientRect();
			const vm = this.$root.new(Picker, {
				x: button.offsetWidth + rect.left + window.pageXOffset,
				y: rect.top + window.pageYOffset
			});
			vm.$once('chosen', emoji => {
				insertTextAtCursor(this.$refs.text, emoji);
			});
		},

		post() {
			this.posting = true;

			this.$root.api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				fileIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				visibility: this.$store.state.settings.defaultNoteVisibility
			}).then(data => {
				this.clear();
			}).catch(err => {
				alert('Something happened');
			}).then(() => {
				this.posting = false;
				this.$nextTick(() => {
					this.$refs.text.focus();
				});
			});
		},

		clear() {
			this.text = '';
			this.files = [];
		}
	}
});
</script>

<style lang="stylus" scoped>
.lhcuptdmcdkfwmipgazeawoiuxpzaclc-body
	> .textarea
		> .emoji
			position absolute
			top 0
			right 0
			padding 10px
			font-size 18px
			color var(--text)
			opacity 0.5

			&:hover
				color var(--textHighlighted)
				opacity 1

			&:active
				color var(--primary)
				opacity 1

		> textarea
			display block
			width 100%
			max-width 100%
			min-width 100%
			padding 16px
			color var(--desktopPostFormTextareaFg)
			outline none
			background var(--desktopPostFormTextareaBg)
			border none
			border-bottom solid 1px var(--faceDivider)
			padding-right 30px

			&:focus
				& + .emoji
					opacity 0.7

	> .files
		> div
			padding 4px

			&:after
				content ""
				display block
				clear both

			> div
				float left
				border solid 4px transparent
				cursor move

				&:hover > .remove
					display block

				> .img
					width 64px
					height 64px
					background-size cover
					background-position center center

				> .remove
					display none
					position absolute
					top -6px
					right -6px
					width 16px
					height 16px
					cursor pointer

	> input[type=file]
		display none

	> footer
		display flex
		padding 8px

		> button:not(.post)
			color var(--text)

			&:hover
				color var(--textHighlighted)

		> .post
			display block
			margin 0 0 0 auto
			padding 0 10px
			height 28px
			color var(--primaryForeground)
			background var(--primary) !important
			outline none
			border none
			border-radius 4px
			transition background 0.1s ease
			cursor pointer

			&:hover
				background var(--primaryLighten10) !important

			&:active
				background var(--primaryDarken10) !important
				transition background 0s ease

</style>
