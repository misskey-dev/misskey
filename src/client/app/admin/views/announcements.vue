<template>
<div>
	<ui-card>
		<div slot="title">%fa:broadcast-tower% %i18n:@announcements%</div>
		<section v-for="(announcement, i) in announcements" class="fit-top">
			<ui-input v-model="announcement.title" @change="save">
				<span>%i18n:@title%</span>
			</ui-input>
			<ui-textarea v-model="announcement.text">
				<span>%i18n:@text%</span>
			</ui-textarea>
			<ui-horizon-group>
				<ui-button @click="save">%fa:save R% %i18n:@save%</ui-button>
				<ui-button @click="remove(i)">%fa:trash-alt R% %i18n:@remove%</ui-button>
			</ui-horizon-group>
		</section>
		<section>
			<ui-button @click="add">%fa:plus% %i18n:@add%</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
			announcements: [],
		};
	},

	created() {
		(this as any).os.getMeta().then(meta => {
			this.announcements = meta.broadcasts;
		});
	},

	methods: {
		add() {
			this.announcements.push({
				title: '',
				text: ''
			});
		},

		remove(i) {
			this.announcements = this.announcements.filter((_, j) => j !== i);
			this.save();
		},

		save() {
			(this as any).api('admin/update-meta', {
				broadcasts: this.announcements
			}).then(() => {
				(this as any).os.apis.dialog({ text: `Saved` });
			}).catch(e => {
				(this as any).os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>
