<template>
<div class="egwyvoaaryotefqhqtmiyawwefemjfsd">
	<ui-container :show-header="false" :naked="props.design == 2">
		<div class="egwyvoaaryotefqhqtmiyawwefemjfsd-body"
			:data-compact="props.design == 1 || props.design == 2"
			:data-melt="props.design == 2"
		>
			<div class="banner"
				:style="$store.state.i.bannerUrl ? `background-image: url(${$store.state.i.bannerUrl})` : ''"
				:title="$t('update-banner')"
				@click="updateBanner()"
			></div>
			<mk-avatar class="avatar" :user="$store.state.i"
				:disable-link="true"
				@click="updateAvatar()"
				:title="$t('update-avatar')"
			/>
			<router-link class="name" :to="$store.state.i | userPage"><mk-user-name :user="$store.state.i"/></router-link>
			<p class="username">@{{ $store.state.i | acct }}</p>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import updateAvatar from '../../api/update-avatar';
import updateBanner from '../../api/update-banner';

export default define({
	name: 'profile',
	props: () => ({
		design: 0
	})
}).extend({
	i18n: i18n('desktop/views/widgets/profile.vue'),
	methods: {
		func() {
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		},
		updateAvatar() {
			updateAvatar(this.$root)();
		},
		updateBanner() {
			updateBanner(this.$root)();
		}
	}
});
</script>

<style lang="stylus" scoped>
.egwyvoaaryotefqhqtmiyawwefemjfsd-body
	&[data-compact]
		> .banner:before
			content ""
			display block
			width 100%
			height 100%
			background rgba(#000, 0.5)

		> .avatar
			top ((100px - 58px) / 2)
			left ((100px - 58px) / 2)
			border none
			border-radius 100%
			box-shadow 0 0 16px rgba(#000, 0.5)

		> .name
			position absolute
			top 0
			left 92px
			margin 0
			line-height 100px
			color #fff
			text-shadow 0 0 8px rgba(#000, 0.5)

		> .username
			display none

	&[data-melt]
		> .banner
			visibility hidden

		> .avatar
			box-shadow none

		> .name
			color #666
			text-shadow none

	> .banner
		height 100px
		background-color var(--primaryAlpha01)
		background-size cover
		background-position center
		cursor pointer

	> .avatar
		display block
		position absolute
		top 76px
		left 16px
		width 58px
		height 58px
		border solid 3px var(--face)
		border-radius 8px
		cursor pointer

	> .name
		display block
		margin 10px 0 0 84px
		line-height 16px
		font-weight bold
		color var(--text)
		overflow hidden
		text-overflow ellipsis

	> .username
		display block
		margin 4px 0 8px 84px
		line-height 16px
		font-size 0.9em
		color var(--text)
		opacity 0.7

</style>
