<template>
<ui-card>
	<template #title><fa icon="user"/> {{ $t('title') }}</template>

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
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
			</ui-input>

			<ui-input v-model="location">
				<span>{{ $t('location') }}</span>
				<template #prefix><fa icon="map-marker-alt"/></template>
			</ui-input>

			<ui-input v-model="birthday" type="date">
				<template #title>{{ $t('birthday') }}</template>
				<template #prefix><fa icon="birthday-cake"/></template>
			</ui-input>

			<ui-textarea v-model="description" :max="500">
				<span>{{ $t('description') }}</span>
				<template #desc>{{ $t('you-can-include-hashtags') }}</template>
			</ui-textarea>

			<ui-select v-model="lang">
				<template #label>{{ $t('language') }}</template>
				<template #icon><fa icon="language"/></template>
				<option v-for="lang in unique(Object.values(langmap).map(x => x.nativeName)).map(name => Object.keys(langmap).find(k => langmap[k].nativeName == name))" :value="lang" :key="lang">{{ langmap[lang].nativeName }}</option>
			</ui-select>

			<ui-input type="file" @change="onAvatarChange">
				<span>{{ $t('avatar') }}</span>
				<template #icon><fa icon="image"/></template>
				<template #desc v-if="avatarUploading">{{ $t('uploading') }}<mk-ellipsis/></template>
			</ui-input>

			<ui-input type="file" @change="onBannerChange">
				<span>{{ $t('banner') }}</span>
				<template #icon><fa icon="image"/></template>
				<template #desc v-if="bannerUploading">{{ $t('uploading') }}<mk-ellipsis/></template>
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
			<ui-switch v-model="carefulBot" :disabled="isLocked" @change="save(false)">{{ $t('careful-bot') }}</ui-switch>
			<ui-switch v-model="autoAcceptFollowed" :disabled="!isLocked && !carefulBot" @change="save(false)">{{ $t('auto-accept-followed') }}</ui-switch>
		</div>
	</section>

	<section v-if="enableEmail">
		<header>{{ $t('email') }}</header>

		<div>
			<template v-if="$store.state.i.email != null">
				<ui-info v-if="$store.state.i.emailVerified">{{ $t('email-verified') }}</ui-info>
				<ui-info v-else warn>{{ $t('email-not-verified') }}</ui-info>
			</template>
			<ui-input v-model="email" type="email"><span>{{ $t('email-address') }}</span></ui-input>
			<ui-button @click="updateEmail()">{{ $t('save') }}</ui-button>
		</div>
	</section>

	<section>
		<header>{{ $t('export') }}</header>

		<div>
			<ui-select v-model="exportTarget">
				<option value="notes">{{ $t('export-targets.all-notes') }}</option>
				<option value="following">{{ $t('export-targets.following-list') }}</option>
				<option value="mute">{{ $t('export-targets.mute-list') }}</option>
				<option value="blocking">{{ $t('export-targets.blocking-list') }}</option>
			</ui-select>
			<ui-button @click="doExport()"><fa :icon="faDownload"/> {{ $t('export') }}</ui-button>
		</div>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, host } from '../../../config';
import { toUnicode } from 'punycode';
import langmap from 'langmap';
import { unique } from '../../../../../prelude/array';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/profile-editor.vue'),

	data() {
		return {
			unique,
			langmap,
			host: toUnicode(host),
			enableEmail: false,
			email: null,
			name: null,
			username: null,
			location: null,
			description: null,
			lang: null,
			birthday: null,
			avatarId: null,
			bannerId: null,
			isCat: false,
			isBot: false,
			isLocked: false,
			carefulBot: false,
			autoAcceptFollowed: false,
			saving: false,
			avatarUploading: false,
			bannerUploading: false,
			exportTarget: 'notes',
			faDownload
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
		this.$root.getMeta().then(meta => {
			this.enableEmail = meta.enableEmail;
		});
		this.email = this.$store.state.i.email;
		this.name = this.$store.state.i.name;
		this.username = this.$store.state.i.username;
		this.location = this.$store.state.i.profile.location;
		this.description = this.$store.state.i.description;
		this.lang = this.$store.state.i.lang;
		this.birthday = this.$store.state.i.profile.birthday;
		this.avatarId = this.$store.state.i.avatarId;
		this.bannerId = this.$store.state.i.bannerId;
		this.isCat = this.$store.state.i.isCat;
		this.isBot = this.$store.state.i.isBot;
		this.isLocked = this.$store.state.i.isLocked;
		this.carefulBot = this.$store.state.i.carefulBot;
		this.autoAcceptFollowed = this.$store.state.i.autoAcceptFollowed;
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
				lang: this.lang,
				birthday: this.birthday || null,
				avatarId: this.avatarId || undefined,
				bannerId: this.bannerId || undefined,
				isCat: !!this.isCat,
				isBot: !!this.isBot,
				isLocked: !!this.isLocked,
				carefulBot: !!this.carefulBot,
				autoAcceptFollowed: !!this.autoAcceptFollowed
			}).then(i => {
				this.saving = false;
				this.$store.state.i.avatarId = i.avatarId;
				this.$store.state.i.avatarUrl = i.avatarUrl;
				this.$store.state.i.bannerId = i.bannerId;
				this.$store.state.i.bannerUrl = i.bannerUrl;

				if (notify) {
					this.$root.dialog({
						type: 'success',
						text: this.$t('saved')
					});
				}
			});
		},

		updateEmail() {
			this.$root.dialog({
				title: this.$t('@.enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/update_email', {
					password: password,
					email: this.email == '' ? null : this.email
				});
			});
		},

		doExport() {
			this.$root.api(
				this.exportTarget == 'notes' ? 'i/export-notes' :
				this.exportTarget == 'following' ? 'i/export-following' :
				this.exportTarget == 'mute' ? 'i/export-mute' :
				this.exportTarget == 'blocking' ? 'i/export-blocking' :
				null, {});

			this.$root.dialog({
				type: 'info',
				text: this.$t('export-requested')
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

</style>
