<template>
<div class="ngbfujlo">
	<ui-textarea class="textarea" :value="text" readonly></ui-textarea>
	<ui-button primary @click="post()" :disabled="posting || posted">{{ posted ? $t('posted-from-post-form') : $t('post-from-post-form') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('pages'),

	props: {
		value: {
			required: true
		},
		script: {
			required: true
		}
	},

	data() {
		return {
			text: this.script.interpolate(this.value.text),
			posted: false,
			posting: false,
		};
	},

	created() {
		this.$watch('script.vars', () => {
			this.text = this.script.interpolate(this.value.text);
		}, { deep: true });
	},

	methods: {
		post() {
			this.posting = true;
			this.$root.api('notes/create', {
				text: this.text,
			}).then(() => {
				this.posted = true;
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.ngbfujlo
	padding 0 32px 32px 32px
	border solid 2px var(--pageBlockBorder)
	border-radius 6px

	@media (max-width 600px)
		padding 0 16px 16px 16px

		> .textarea
			margin-top 16px
			margin-bottom 16px

</style>
