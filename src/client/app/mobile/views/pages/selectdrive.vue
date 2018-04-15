<template>
<div class="mk-selectdrive">
	<header>
		<h1>%i18n:@select-file%<span class="count" v-if="files.length > 0">({{ files.length }})</span></h1>
		<button class="upload" @click="upload">%fa:upload%</button>
		<button v-if="multiple" class="ok" @click="ok">%fa:check%</button>
	</header>
	<mk-drive ref="browser" select-file :multiple="multiple" is-naked :top="42"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			files: []
		};
	},
	computed: {
		multiple(): boolean {
			const q = (new URL(location.toString())).searchParams;
			return q.get('multiple') == 'true';
		}
	},
	mounted() {
		document.title = '%i18n:@title%';
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
		close() {
			window.close();
		},
		ok() {
			window.opener.cb(this.multiple ? this.files : this.files[0]);
			this.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-selectdrive
	width 100%
	height 100%
	background #fff

	> header
		position fixed
		top 0
		left 0
		width 100%
		z-index 1000
		background #fff
		box-shadow 0 1px rgba(0, 0, 0, 0.1)

		> h1
			margin 0
			padding 0
			text-align center
			line-height 42px
			font-size 1em
			font-weight normal

			> .count
				margin-left 4px
				opacity 0.5

		> .upload
			position absolute
			top 0
			left 0
			line-height 42px
			width 42px

		> .ok
			position absolute
			top 0
			right 0
			line-height 42px
			width 42px

	> .mk-drive
		top 42px

</style>
