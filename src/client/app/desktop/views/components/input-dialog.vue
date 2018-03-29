<template>
<mk-window ref="window" is-modal width="500px" @before-close="beforeClose" @closed="$destroy">
	<span slot="header" :class="$style.header">
		%fa:i-cursor%{{ title }}
	</span>

	<div :class="$style.body">
		<input ref="text" v-model="text" :type="type" @keydown="onKeydown" :placeholder="placeholder"/>
	</div>
	<div :class="$style.actions">
		<button :class="$style.cancel" @click="cancel">キャンセル</button>
		<button :class="$style.ok" :disabled="!allowEmpty && text.length == 0" @click="ok">決定</button>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		title: {
			type: String
		},
		placeholder: {
			type: String
		},
		default: {
			type: String
		},
		allowEmpty: {
			default: true
		},
		type: {
			default: 'text'
		}
	},
	data() {
		return {
			done: false,
			text: ''
		};
	},
	mounted() {
		if (this.default) this.text = this.default;
		this.$nextTick(() => {
			(this.$refs.text as any).focus();
		});
	},
	methods: {
		ok() {
			if (!this.allowEmpty && this.text == '') return;
			this.done = true;
			(this.$refs.window as any).close();
		},
		cancel() {
			this.done = false;
			(this.$refs.window as any).close();
		},
		beforeClose() {
			if (this.done) {
				this.$emit('done', this.text);
			} else {
				this.$emit('canceled');
			}
		},
		onKeydown(e) {
			if (e.which == 13) { // Enter
				e.preventDefault();
				e.stopPropagation();
				this.ok();
			}
		}
	}
});
</script>


<style lang="stylus" module>
@import '~const.styl'

.header
	> [data-fa]
		margin-right 4px

.body
	padding 16px

	> input
		display block
		padding 8px
		margin 0
		width 100%
		max-width 100%
		min-width 100%
		font-size 1em
		color #333
		background #fff
		outline none
		border solid 1px rgba($theme-color, 0.1)
		border-radius 4px
		transition border-color .3s ease

		&:hover
			border-color rgba($theme-color, 0.2)
			transition border-color .1s ease

		&:focus
			color $theme-color
			border-color rgba($theme-color, 0.5)
			transition border-color 0s ease

		&::-webkit-input-placeholder
			color rgba($theme-color, 0.3)

.actions
	height 72px
	background lighten($theme-color, 95%)

.ok
.cancel
	display block
	position absolute
	bottom 16px
	cursor pointer
	padding 0
	margin 0
	width 120px
	height 40px
	font-size 1em
	outline none
	border-radius 4px

	&:focus
		&:after
			content ""
			pointer-events none
			position absolute
			top -5px
			right -5px
			bottom -5px
			left -5px
			border 2px solid rgba($theme-color, 0.3)
			border-radius 8px

	&:disabled
		opacity 0.7
		cursor default

.ok
	right 16px
	color $theme-color-foreground
	background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
	border solid 1px lighten($theme-color, 15%)

	&:not(:disabled)
		font-weight bold

	&:hover:not(:disabled)
		background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
		border-color $theme-color

	&:active:not(:disabled)
		background $theme-color
		border-color $theme-color

.cancel
	right 148px
	color #888
	background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
	border solid 1px #e2e2e2

	&:hover
		background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
		border-color #dcdcdc

	&:active
		background #ececec
		border-color #dcdcdc

</style>
