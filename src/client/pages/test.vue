<template>
<div>
	<portal to="header"><fa :icon="faExclamationTriangle"/>TEST</portal>

	<div class="_card">
		<div class="_title">Dialog</div>
		<div class="_content">
			<mk-input v-model:value="dialogTitle">
				<span>Title</span>
			</mk-input>
			<mk-input v-model:value="dialogBody">
				<span>Body</span>
			</mk-input>
			<mk-switch v-model:value="dialogCancel">
				<span>With cancel button</span>
			</mk-switch>
			<mk-button @click="showDialog()">Show</mk-button>
		</div>
		<div class="_content">
			<span>Result: {{ dialogResult }}</span>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../components/ui/button.vue';
import MkInput from '../components/ui/input.vue';
import MkSwitch from '../components/ui/switch.vue';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
	},

	metaInfo() {
		return {
			title: this.$t('notFound') as string
		};
	},

	data() {
		return {
			dialogTitle: 'Hello',
			dialogBody: 'World!',
			dialogResult: null,
			dialogCancel: false,
			faExclamationTriangle
		}
	},

	methods: {
		async showDialog() {
			this.dialogResult = await this.$store.dispatch('showDialog', {
				title: this.dialogTitle,
				text: this.dialogBody,
				showCancelButton: this.dialogCancel,
			});
		}
	}
});
</script>
