<template>
<div>
	<portal to="header"><fa :icon="faExclamationTriangle"/>TEST</portal>

	<div class="_card">
		<div class="_title">Dialog</div>
		<div class="_content">
			<mk-input v-model:value="dialogTitle">
				<span>Title</span>
			</mk-input>
			<mk-button @click="showDialog()">Show</mk-button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../components/ui/button.vue';
import MkInput from '../components/ui/input.vue';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
	},

	metaInfo() {
		return {
			title: this.$t('notFound') as string
		};
	},

	data() {
		return {
			dialogTitle: 'Title',
			faExclamationTriangle
		}
	},

	methods: {
		showDialog() {
			this.$root.showDialog({
				title: this.dialogTitle,
			})
		}
	}
});
</script>
