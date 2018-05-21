<template>
	<md-card>
		<md-card-header>
			<div class="md-title">%fa:pencil-alt% %i18n:@title%</div>
		</md-card-header>

		<md-card-content>
			<md-field>
				<label>%i18n:@name%</label>
				<md-input v-model="name" :disabled="saving" md-counter="30"/>
			</md-field>

			<md-field>
				<label>%i18n:@account%</label>
				<span class="md-prefix">@</span>
				<md-input v-model="username" readonly></md-input>
				<span class="md-suffix">@{{ host }}</span>
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
				<span class="md-helper-text">%i18n:@will-be-published%</span>
			</md-field>

			<md-field>
				<label>%i18n:@description%</label>
				<md-textarea v-model="description" :disabled="saving" md-counter="500"/>
			</md-field>

			<md-field>
				<label>%i18n:@avatar%</label>
				<md-file @md-change="onAvatarChange"/>
			</md-field>

			<md-field>
				<label>%i18n:@banner%</label>
				<md-file @md-change="onBannerChange"/>
			</md-field>

			<md-dialog-alert
					:md-active.sync="uploading"
					md-content="%18n:!@uploading%"/>

			<div>
				<md-switch v-model="isBot">%i18n:@is-bot%</md-switch>
			</div>

			<div>
				<md-switch v-model="isCat">%i18n:@is-cat%</md-switch>
			</div>
		</md-card-content>

		<md-card-actions>
			<md-button class="md-primary" :disabled="saving" @click="save">%i18n:@save%</md-button>
		</md-card-actions>
	</md-card>
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
		this.name = (this as any).os.i.name || '';
		this.username = (this as any).os.i.username;
		this.location = (this as any).os.i.profile.location;
		this.description = (this as any).os.i.description;
		this.birthday = (this as any).os.i.profile.birthday;
		this.avatarId = (this as any).os.i.avatarId;
		this.bannerId = (this as any).os.i.bannerId;
		this.isBot = (this as any).os.i.isBot;
		this.isCat = (this as any).os.i.isCat;
	},

	methods: {
		onAvatarChange([file]) {
			this.uploading = true;

			const data = new FormData();
			data.append('file', file);
			data.append('i', (this as any).os.i.token);

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
			data.append('i', (this as any).os.i.token);

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
				(this as any).os.i.avatarId = i.avatarId;
				(this as any).os.i.avatarUrl = i.avatarUrl;
				(this as any).os.i.bannerId = i.bannerId;
				(this as any).os.i.bannerUrl = i.bannerUrl;

				alert('%i18n:@saved%');
			});
		}
	}
});
</script>
