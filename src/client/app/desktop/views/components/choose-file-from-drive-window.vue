<template>
<mk-window ref="window" is-modal width="800px" height="500px" @closed="destroyDom">
	<template #header>
		<span class="jqiaciqv">
			<span class="title">{{ $t('choose-prompt') }}</span>
			<span class="count" v-if="multiple && files.length > 0">({{ $t('chosen-files', { count: files.length }) }})</span>
		</span>
	</template>

	<div class="rqsvbumu">
		<x-drive
			ref="browser"
			class="browser"
			:type="type"
			:multiple="multiple"
			@selected="onSelected"
			@change-selection="onChangeSelection"
		/>
		<div class="footer">
			<button class="upload" :title="$t('title')" @click="upload"><fa icon="upload"/></button>
			<ui-button inline @click="cancel" style="margin-right:16px;">{{ $t('cancel') }}</ui-button>
			<ui-button inline primary :disabled="multiple && files.length == 0" @click="ok">{{ $t('ok') }}</ui-button>
		</div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
export default Vue.extend({
	i18n: i18n('desktop/views/components/choose-file-from-drive-window.vue'),
	components: {
		XDrive: () => import('./drive.vue').then(m => m.default),
	},
	props: {
		type: {
			type: String,
			required: false,
			default: undefined 
		},
		multiple: {
			default: false
		}
	},
	data() {
		return {
			files: []
		};
	},
	methods: {
		onSelected(file) {
			this.files = [file];
			this.ok();
		},
		onChangeSelection(files) {
			this.files = files;
		},
		upload() {
			(this.$refs.browser as any).selectLocalFile();
		},
		ok() {
			this.$emit('selected', this.multiple ? this.files : this.files[0]);
			(this.$refs.window as any).close();
		},
		cancel() {
			(this.$refs.window as any).close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.jqiaciqv
	.title
		> [data-icon]
			margin-right 4px

	.count
		margin-left 8px
		opacity 0.7

.rqsvbumu
	display flex
	flex-direction column
	height 100%

	.browser
		flex 1
		overflow auto

	.footer
		padding 16px
		background var(--desktopPostFormBg)
		text-align right

	.upload
		display inline-block
		position absolute
		top 8px
		left 16px
		cursor pointer
		padding 0
		margin 8px 4px 0 0
		width 40px
		height 40px
		font-size 1em
		color var(--primaryAlpha05)
		background transparent
		outline none
		border solid 1px transparent
		border-radius 4px

		&:hover
			background transparent
			border-color var(--primaryAlpha03)

		&:active
			color var(--primaryAlpha06)
			background transparent
			border-color var(--primaryAlpha05)
			//box-shadow 0 2px 4px rgba(var(--primaryDarken50), 0.15) inset

		&:focus
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid var(--primaryAlpha03)
				border-radius 8px

</style>
