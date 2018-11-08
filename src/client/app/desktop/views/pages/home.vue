<template>
<mk-ui>
	<mk-home :mode="mode" @loaded="loaded" ref="home" v-hotkey.global="keymap"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('.vue'),
	props: {
		mode: {
			type: String,
			default: 'timeline'
		}
	},
	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		}
	},
	mounted() {
		document.title = (this as any).os.instanceName;

		Progress.start();
	},
	methods: {
		loaded() {
			Progress.done();
		},
		focus() {
			this.$refs.home.focus();
		}
	}
});
</script>
