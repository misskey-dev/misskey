<template>
<div class="mk-renote-form">
	<mk-note-preview class="preview" :note="note"/>
	<x-post-form ref="form" :renote="note" @posted="onChildFormPosted"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/renote-form.vue'),

	components: {
		XPostForm: () => import('./post-form.vue').then(m => m.default)
	},

	props: {
		note: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			wait: false,
		};
	},

	methods: {
		onChildFormPosted() {
			this.$emit('posted');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-renote-form
	> .preview
		margin 16px 22px

	> footer
		height 72px
		background var(--desktopRenoteFormFooter)

		> .quote
			position absolute
			bottom 16px
			left 28px
			line-height 40px

		> .button
			display block
			position absolute
			bottom 16px
			width 120px
			height 40px

			&.cancel
				right 280px

			&.home
				right 148px
				font-size 13px

			&.ok
				right 16px

</style>
