<template>
<ui-card>
	<div slot="title">%fa:user% %i18n:@title%</div>

	<ui-form :disabled="saving">
		<ui-input v-model="name" :max="30">
			<span>%i18n:@name%</span>
		</ui-input>

		<ui-input v-model="username" readonly>
			<span>%i18n:@account%</span>
			<span slot="prefix">@</span>
			<span slot="suffix">@{{ host }}</span>
		</ui-input>

		<ui-input v-model="location">
			<span>%i18n:@location%</span>
			<span slot="prefix">%fa:map-marker-alt%</span>
		</ui-input>

		<ui-input v-model="birthday" type="date">
			<span>%i18n:@birthday%</span>
			<span slot="prefix">%fa:birthday-cake%</span>
		</ui-input>

		<ui-textarea v-model="description" :max="500">
			<span>%i18n:@description%</span>
		</ui-textarea>

		<ui-input type="file" @change="onAvatarChange">
			<span>%i18n:@avatar%</span>
			<span slot="icon">%fa:image%</span>
		</ui-input>

		<ui-input type="file" @change="onBannerChange">
			<span>%i18n:@banner%</span>
			<span slot="icon">%fa:image%</span>
		</ui-input>

		<ui-switch v-model="isCat">%i18n:@is-cat%</ui-switch>

		<ui-button @click="save">%i18n:@save%</ui-button>
	</ui-form>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, host } from '../../../../config';

export default Vue.extend({
	data() {
		return {
			host,
			name: null,
			username: null,
			location: null,
			description: null,
			birthday: null,
			avatarId: null,
			bannerId: null,
			isBot: false,
			isCat: false,
			saving: false,
			uploading: false
		};
	},

	created() {
		this.name = this.$store.state.i.name || '';
		this.username = this.$store.state.i.username;
		this.location = this.$store.state.i.profile.location;
		this.description = this.$store.state.i.description;
		this.birthday = this.$store.state.i.profile.birthday;
		this.avatarId = this.$store.state.i.avatarId;
		this.bannerId = this.$store.state.i.bannerId;
		this.isBot = this.$store.state.i.isBot;
		this.isCat = this.$store.state.i.isCat;
	},

	methods: {
		onAvatarChange([file]) {
			this.uploading = true;

			const data = new FormData();
			data.append('file', file);
			data.append('i', this.$store.state.i.token);

			fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: data
			})
			.then(response => response.json())
			.then(f => {
				this.avatarId = f.id;
				this.uploading = false;
			})
			.catch(e => {
				this.uploading = false;
				alert('%18n:!@upload-failed%');
			});
		},

		onBannerChange([file]) {
			this.uploading = true;

			const data = new FormData();
			data.append('file', file);
			data.append('i', this.$store.state.i.token);

			fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: data
			})
			.then(response => response.json())
			.then(f => {
				this.bannerId = f.id;
				this.uploading = false;
			})
			.catch(e => {
				this.uploading = false;
				alert('%18n:!@upload-failed%');
			});
		},

		save() {
			this.saving = true;

			(this as any).api('i/update', {
				name: this.name || null,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null,
				avatarId: this.avatarId,
				bannerId: this.bannerId,
				isBot: this.isBot,
				isCat: this.isCat
			}).then(i => {
				this.saving = false;
				this.$store.state.i.avatarId = i.avatarId;
				this.$store.state.i.avatarUrl = i.avatarUrl;
				this.$store.state.i.bannerId = i.bannerId;
				this.$store.state.i.bannerUrl = i.bannerUrl;

				alert('%i18n:@saved%');
			});
		}
	}
});
</script>
