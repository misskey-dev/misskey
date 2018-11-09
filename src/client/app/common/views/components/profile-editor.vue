<template>
<ui-card>
	<div slot="title"><fa icon="user"/> {{ $t('title') }}</div>

	<section class="esokaraujimuwfttfzgocmutcihewscl">
		<div class="header" :style="bannerStyle">
			<mk-avatar class="avatar" :user="$store.state.i" :disable-preview="true" :disable-link="true"/>
		</div>

		<ui-form :disabled="saving">
			<ui-input v-model="name" :max="30">
				<span>{{ $t('name') }}</span>
			</ui-input>

			<ui-input v-model="username" readonly>
				<span>{{ $t('account') }}</span>
				<span slot="prefix">@</span>
				<span slot="suffix">@{{ host }}</span>
			</ui-input>

			<ui-input v-model="location">
				<span>{{ $t('location') }}</span>
				<span slot="prefix"><fa icon="map-marker-alt"/></span>
			</ui-input>

			<ui-input v-model="birthday" type="date">
				<span>{{ $t('birthday') }}</span>
				<span slot="prefix"><fa icon="birthday-cake"/></span>
			</ui-input>

			<ui-textarea v-model="description" :max="500">
				<span>{{ $t('description') }}</span>
			</ui-textarea>

			<ui-input type="file" @change="onAvatarChange">
				<span>{{ $t('avatar') }}</span>
				<span slot="icon"><fa icon="image"/></span>
				<span slot="desc" v-if="avatarUploading">{{ $t('uploading') }}<mk-ellipsis/></span>
			</ui-input>

			<ui-input type="file" @change="onBannerChange">
				<span>{{ $t('banner') }}</span>
				<span slot="icon"><fa icon="image"/></span>
				<span slot="desc" v-if="bannerUploading">{{ $t('uploading') }}<mk-ellipsis/></span>
			</ui-input>

			<ui-button @click="save(true)">{{ $t('save') }}</ui-button>
		</ui-form>
	</section>

	<section>
		<header>{{ $t('advanced') }}</header>

		<div>
			<ui-switch v-model="isCat" @change="save(false)">{{ $t('is-cat') }}</ui-switch>
			<ui-switch v-model="isBot" @change="save(false)">{{ $t('is-bot') }}</ui-switch>
			<ui-switch v-model="alwaysMarkNsfw">{{ $t('@.always-mark-nsfw') }}</ui-switch>
		</div>
	</section>

	<section>
		<header>{{ $t('privacy') }}</header>

		<div>
			<ui-switch v-model="isLocked" @change="save(false)">{{ $t('is-locked') }}</ui-switch>
			<ui-switch v-model="carefulBot" @change="save(false)">{{ $t('careful-bot') }}</ui-switch>
		</div>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, host } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/profile-editor.vue'),
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
			isCat: false,
			isBot: false,
			isLocked: false,
			carefulBot: false,
			saving: false,
			avatarUploading: false,
			bannerUploading: false
		};
	},

	computed: {
		alwaysMarkNsfw: {
			get() { return this.$store.state.i.settings.alwaysMarkNsfw; },
			set(value) { this.$root.api('i/update', { alwaysMarkNsfw: value }); }
		},

		bannerStyle(): any {
			if (this.$store.state.i.bannerUrl == null) return {};
			return {
				backgroundColor: this.$store.state.i.bannerColor && this.$store.state.i.bannerColor.length == 3 ? `rgb(${ this.$store.state.i.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.$store.state.i.bannerUrl })`
			};
		},
	},

	created() {
		this.name = this.$store.state.i.name || '';
		this.username = this.$store.state.i.username;
		this.location = this.$store.state.i.profile.location;
		this.description = this.$store.state.i.description;
		this.birthday = this.$store.state.i.profile.birthday;
		this.avatarId = this.$store.state.i.avatarId;
		this.bannerId = this.$store.state.i.bannerId;
		this.isCat = this.$store.state.i.isCat;
		this.isBot = this.$store.state.i.isBot;
		this.isLocked = this.$store.state.i.isLocked;
		this.carefulBot = this.$store.state.i.carefulBot;
	},

	methods: {
		onAvatarChange([file]) {
			this.avatarUploading = true;

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
					this.avatarUploading = false;
				})
				.catch(e => {
					this.avatarUploading = false;
					alert('%18n:@upload-failed%');
				});
		},

		onBannerChange([file]) {
			this.bannerUploading = true;

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
					this.bannerUploading = false;
				})
				.catch(e => {
					this.bannerUploading = false;
					alert('%18n:@upload-failed%');
				});
		},

		save(notify) {
			this.saving = true;

			this.$root.api('i/update', {
				name: this.name || null,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null,
				avatarId: this.avatarId,
				bannerId: this.bannerId,
				isCat: !!this.isCat,
				isBot: !!this.isBot,
				isLocked: !!this.isLocked,
				carefulBot: !!this.carefulBot
			}).then(i => {
				this.saving = false;
				this.$store.state.i.avatarId = i.avatarId;
				this.$store.state.i.avatarUrl = i.avatarUrl;
				this.$store.state.i.bannerId = i.bannerId;
				this.$store.state.i.bannerUrl = i.bannerUrl;

				if (notify) {
					this.$swal({
						type: 'success',
						text: this.$t('saved')
					});
				}
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.esokaraujimuwfttfzgocmutcihewscl
	> .header
		height 150px
		overflow hidden
		background-size cover
		background-position center
		border-radius 4px

		> .avatar
			position absolute
			top 0
			bottom 0
			left 0
			right 0
			display block
			width 72px
			height 72px
			margin auto
			box-shadow 0 0 16px rgba(0, 0, 0, 0.5)

</style>
