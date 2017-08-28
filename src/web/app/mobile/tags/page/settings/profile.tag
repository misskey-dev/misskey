<mk-profile-setting-page>
	<mk-ui ref="ui">
		<mk-profile-setting/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-profile-setting-page.title%';
			ui.trigger('title', '<i class="fa fa-user"></i>%i18n:mobile.tags.mk-profile-setting-page.title%');
			document.documentElement.style.background = '#eee';
		});
	</script>
</mk-profile-setting-page>

<mk-profile-setting>
	<label>
		<p>%i18n:mobile.tags.mk-profile-setting.name%</p>
		<input ref="name" type="text" value={ I.name }/>
	</label>
	<label>
		<p>%i18n:mobile.tags.mk-profile-setting.location%</p>
		<input ref="location" type="text" value={ I.profile.location }/>
	</label>
	<label>
		<p>%i18n:mobile.tags.mk-profile-setting.description%</p>
		<textarea ref="description">{ I.description }</textarea>
	</label>
	<label>
		<p>%i18n:mobile.tags.mk-profile-setting.birthday%</p>
		<input ref="birthday" type="date" value={ I.profile.birthday }/>
	</label>
	<button class="save" onclick={ save } disabled={ saving }><i class="fa fa-check"></i>%i18n:mobile.tags.mk-profile-setting.save%</button>
	<style>
		:scope
			display block

			> label
				display block
				margin 0
				padding 16px 0

				> p:first-child
					display block
					margin 0
					padding 0 0 4px 8px
					font-weight bold
					color #333

				> input[type="text"]
				> textarea
					display block
					width 100%
					padding 12px
					font-size 16px
					border none
					border-radius none

				> textarea
					min-height 80px

			> .save
				display block
				margin 8px
				padding 16px
				width calc(100% - 16px)
				font-size 16px
				color $theme-color-foreground
				background $theme-color
				border-radius 4px

				&:disabled
					opacity 0.7

				> i
					margin-right 4px

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.save = () => {
			this.update({
				saving: true
			});

			this.api('i/update', {
				name: this.refs.name.value,
				location: this.refs.location.value || null,
				description: this.refs.description.value || null,
				birthday: this.refs.birthday.value || null
			}).then(() => {
				this.update({
					saving: false
				});

				alert('%i18n:mobile.tags.mk-profile-setting.saved%');
			});
		};
	</script>
</mk-profile-setting>
