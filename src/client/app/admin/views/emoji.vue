<template>
<div>
	<ui-card>
		<div slot="title">%fa:plus% %i18n:@add-emoji.title%</div>
		<section class="fit-top">
			<ui-input v-model="name">
				<span>%i18n:@add-emoji.name%</span>
				<span slot="text">%i18n:@add-emoji.name-desc%</span>
			</ui-input>
			<ui-input v-model="aliases">
				<span>%i18n:@add-emoji.aliases%</span>
				<span slot="text">%i18n:@add-emoji.aliases-desc%</span>
			</ui-input>
			<ui-input v-model="url">
				<span>%i18n:@add-emoji.url%</span>
			</ui-input>
			<ui-button @click="add">%i18n:@add-emoji.add%</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
			name: '',
			url: '',
			aliases: '',
		};
	},
	methods: {
		add() {
			(this as any).api('admin/add-emoji', {
				name: this.name,
				url: this.url,
				aliases: this.aliases.split(' ')
			}).then(() => {
				(this as any).os.apis.dialog({ text: `Added` });
			}).catch(e => {
				(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>
