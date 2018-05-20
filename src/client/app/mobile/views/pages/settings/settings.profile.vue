<template>
	<md-card>
		<md-card-header>
			<div class="md-title">%fa:pencil-alt% %i18n:@title%</div>
		</md-card-header>

		<md-card-content>
			<md-field>
				<label>%i18n:@name%</label>
				<md-input v-model="name" :disabled="saving"/>
			</md-field>

			<md-field>
				<label>%i18n:@description%</label>
				<md-textarea v-model="description" :disabled="saving"/>
			</md-field>

			<md-field>
				<md-icon>%fa:map-marker-alt%</md-icon>
				<label>%i18n:@location%</label>
				<md-input v-model="location" :disabled="saving"/>
			</md-field>

			<md-field>
				<md-icon>%fa:birthday-cake%</md-icon>
				<label>%i18n:@birthday%</label>
				<md-input type="date" v-model="birthday" :disabled="saving"/>
			</md-field>

			<div>
				<md-switch v-model="os.i.isBot" @change="onChangeIsBot">%i18n:@is-bot%</md-switch>
			</div>
		</md-card-content>

		<md-card-actions>
			<md-button class="md-primary" :disabled="saving" @click="save">%i18n:@save%</md-button>
		</md-card-actions>
	</md-card>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			name: null,
			location: null,
			description: null,
			birthday: null,
			saving: false
		};
	},

	created() {
		this.name = (this as any).os.i.name || '';
		this.location = (this as any).os.i.profile.location;
		this.description = (this as any).os.i.description;
		this.birthday = (this as any).os.i.profile.birthday;
	},

	methods: {
		onChangeIsBot() {
			(this as any).api('i/update', {
				isBot: (this as any).os.i.isBot
			});
		},

		save() {
			this.saving = true;

			(this as any).api('i/update', {
				name: this.name || null,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null
			}).then(() => {
				this.saving = false;
				alert('%i18n:!@saved%');
			});
		}
	}
});
</script>
