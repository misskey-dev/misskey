<template>
<div class="ngbfujlo">
	<mk-textarea :value="text" readonly style="margin: 0;"></mk-textarea>
	<mk-button class="button" primary @click="post()" :disabled="posting || posted">{{ posted ? $t('posted') : $t('post') }}</mk-button>
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
	padding: 32px;
	border-radius: 6px;
	box-shadow: 0 2px 8px var(--shadow);

	> .button {
		margin-top: 32px;
	}

	@media (max-width: 600px) {
		padding: 16px;

		> .button {
			margin-top: 16px;
		}
	}
}
</style>
