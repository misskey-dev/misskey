<template>
<div class="ngbfujlo">
	<mk-textarea class="textarea" :value="text" readonly></mk-textarea>
	<mk-button primary @click="post()" :disabled="posting || posted">{{ posted ? $t('posted-from-post-form') : $t('post-from-post-form') }}</mk-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import MkTextarea from '../ui/textarea.vue';
import MkButton from '../ui/button.vue';

export default Vue.extend({
	i18n,
	components: {
		MkTextarea,
		MkButton,
	},
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
	watch: {
		'script.vars': {
			handler() {
				this.text = this.script.interpolate(this.value.text);
			},
			deep: true
		}
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
					iconOnly: true, autoClose: true
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.ngbfujlo {
	padding: 0 32px 32px 32px;
	border: solid 2px var(--divider);
	border-radius: 6px;

	@media (max-width: 600px) {
		padding: 0 16px 16px 16px;

		> .textarea {
			margin-top: 16px;
			margin-bottom: 16px;
		}
	}
}
</style>
