<template>
<mk-ui>
	<span slot="header">%fa:user%%i18n:mobile.tags.mk-profile-setting-page.title%</span>
	<div :class="$style.content">
		<p>%fa:info-circle%%i18n:mobile.tags.mk-profile-setting.will-be-published%</p>
		<div :class="$style.form">
			<div :style="os.i.banner_url ? `background-image: url(${os.i.banner_url}?thumbnail&size=1024)` : ''" @click="setBanner">
				<img :src="`${os.i.avatar_url}?thumbnail&size=200`" alt="avatar" @click="setAvatar"/>
			</div>
			<label>
				<p>%i18n:mobile.tags.mk-profile-setting.name%</p>
				<input v-model="name" type="text"/>
			</label>
			<label>
				<p>%i18n:mobile.tags.mk-profile-setting.location%</p>
				<input v-model="location" type="text"/>
			</label>
			<label>
				<p>%i18n:mobile.tags.mk-profile-setting.description%</p>
				<textarea v-model="description"></textarea>
			</label>
			<label>
				<p>%i18n:mobile.tags.mk-profile-setting.birthday%</p>
				<input v-model="birthday" type="date"/>
			</label>
			<label>
				<p>%i18n:mobile.tags.mk-profile-setting.avatar%</p>
				<button @click="setAvatar" :disabled="avatarSaving">%i18n:mobile.tags.mk-profile-setting.set-avatar%</button>
			</label>
			<label>
				<p>%i18n:mobile.tags.mk-profile-setting.banner%</p>
				<button @click="setBanner" :disabled="bannerSaving">%i18n:mobile.tags.mk-profile-setting.set-banner%</button>
			</label>
		</div>
		<button :class="$style.save" @click="save" :disabled="saving">%fa:check%%i18n:mobile.tags.mk-profile-setting.save%</button>
	</div>
</mk-ui>
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
			avatarSaving: false,
			bannerSaving: false,
			saving: false
		};
	},
	created() {
		this.name = (this as any).os.i.name;
		this.location = (this as any).os.i.account.profile.location;
		this.description = (this as any).os.i.description;
		this.birthday = (this as any).os.i.account.profile.birthday;
	},
	mounted() {
		document.title = 'Misskey | %i18n:mobile.tags.mk-profile-setting-page.title%';
		document.documentElement.style.background = '#313a42';
	},
	methods: {
		setAvatar() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				this.avatarSaving = true;

				(this as any).api('i/update', {
					avatar_id: file.id
				}).then(() => {
					this.avatarSaving = false;
					alert('%i18n:mobile.tags.mk-profile-setting.avatar-saved%');
				});
			});
		},
		setBanner() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				this.bannerSaving = true;

				(this as any).api('i/update', {
					banner_id: file.id
				}).then(() => {
					this.bannerSaving = false;
					alert('%i18n:mobile.tags.mk-profile-setting.banner-saved%');
				});
			});
		},
		save() {
			this.saving = true;

			(this as any).api('i/update', {
				name: this.name,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null
			}).then(() => {
				this.saving = false;
				alert('%i18n:mobile.tags.mk-profile-setting.saved%');
			});
		}
	}
});
</script>

<style lang="stylus" module>
@import '~const.styl'

.content
	margin 8px auto
	max-width 500px
	width calc(100% - 16px)

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)

	> p
		display block
		margin 0 0 8px 0
		padding 12px 16px
		font-size 14px
		color #79d4e6
		border solid 1px #71afbb
		//color #276f86
		//background #f8ffff
		//border solid 1px #a9d5de
		border-radius 8px

		> [data-fa]
			margin-right 6px

.form
	position relative
	background #fff
	box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)
	border-radius 8px

	&:before
		content ""
		display block
		position absolute
		bottom -20px
		left calc(50% - 10px)
		border-top solid 10px rgba(0, 0, 0, 0.2)
		border-right solid 10px transparent
		border-bottom solid 10px transparent
		border-left solid 10px transparent

	&:after
		content ""
		display block
		position absolute
		bottom -16px
		left calc(50% - 8px)
		border-top solid 8px #fff
		border-right solid 8px transparent
		border-bottom solid 8px transparent
		border-left solid 8px transparent

	> div
		height 128px
		background-color #e4e4e4
		background-size cover
		background-position center
		border-radius 8px 8px 0 0

		> img
			position absolute
			top 25px
			left calc(50% - 40px)
			width 80px
			height 80px
			border solid 2px #fff
			border-radius 8px

	> label
		display block
		margin 0
		padding 16px
		border-bottom solid 1px #eee

		&:last-of-type
			border none

		> p:first-child
			display block
			margin 0
			padding 0 0 4px 0
			font-weight bold
			color #2f3c42

		> input[type="text"]
		> textarea
			display block
			width 100%
			padding 12px
			font-size 16px
			color #192427
			border solid 2px #ddd
			border-radius 4px

		> textarea
			min-height 80px

.save
	display block
	margin 8px 0 0 0
	padding 16px
	width 100%
	font-size 16px
	color $theme-color-foreground
	background $theme-color
	border-radius 8px

	&:disabled
		opacity 0.7

	> [data-fa]
		margin-right 4px

</style>
