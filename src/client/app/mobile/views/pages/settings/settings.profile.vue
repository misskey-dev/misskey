<template>
	<md-card class="md-layout-item md-size-50 md-small-size-100">
		<md-card-header>
			<div class="md-title">%i18n:@title%</div>
		</md-card-header>

		<md-card-content>
			<md-field>
				<label>%i18n:@name%</label>
				<md-input v-model="name" :disabled="saving"/>
			</md-field>

			<md-field>
				<label>%i18n:@location%</label>
				<md-input v-model="location" :disabled="saving"/>
			</md-field>

			<md-field>
				<label>%i18n:@description%</label>
				<md-textarea v-model="description" :disabled="saving"/>
			</md-field>

			<md-field>
				<label>%i18n:@birthday%</label>
				<md-input type="date" v-model="birthday" :disabled="saving"/>
			</md-field>

			<div>
				<div class="md-body-2">%i18n:@avatar%</div>
				<md-menu md-direction="bottom-end" :md-close-on-select="true">
					<md-button md-menu-trigger>%i18n:@set-avatar%</md-button>
					<md-menu-content>
						<md-menu-item @click="uploadAvatar">%i18n:@upload-avatar%</md-menu-item>
						<md-menu-item @click="chooseAvatar">%i18n:@choose-avatar%</md-menu-item>
					</md-menu-content>
				</md-menu>
			</div>

			<div>
				<div class="md-body-2">%i18n:@banner%</div>
				<md-menu md-direction="bottom-end" :md-close-on-select="true">
					<md-button md-menu-trigger>%i18n:@set-banner%</md-button>
					<md-menu-content>
						<md-menu-item @click="uploadAvatar">%i18n:@upload-banner%</md-menu-item>
						<md-menu-item @click="chooseAvatar">%i18n:@choose-banner%</md-menu-item>
					</md-menu-content>
				</md-menu>
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
		chooseAvatar() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				this.avatarSaving = true;

				(this as any).api('i/update', {
					avatarId: file.id
				}).then(() => {
					this.avatarSaving = false;
					alert('%i18n:!@avatar-saved%');
				});
			});
		},
		chooseBanner() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				this.bannerSaving = true;

				(this as any).api('i/update', {
					bannerId: file.id
				}).then(() => {
					this.bannerSaving = false;
					alert('%i18n:!@banner-saved%');
				});
			});
		},
		uploadAvatar() {
			// a
		},
		uploadBanner() {
			// a
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
