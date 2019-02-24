<template>
<div class="anltbovirfeutcigvwgmgxipejaeozxi">
	<ui-container :show-header="false" :naked="props.design == 1">
		<div class="anltbovirfeutcigvwgmgxipejaeozxi-body"
			:data-found="announcements && announcements.length != 0"
			:data-melt="props.design == 1"
			:data-mobile="platform == 'mobile'"
		>
			<div class="icon">
				<svg height="32" version="1.1" viewBox="0 0 32 32" width="32">
					<path class="tower" d="M16.04,11.24c1.79,0,3.239-1.45,3.239-3.24S17.83,4.76,16.04,4.76c-1.79,0-3.24,1.45-3.24,3.24 C12.78,9.78,14.24,11.24,16.04,11.24z M16.04,13.84c-0.82,0-1.66-0.2-2.4-0.6L7.34,29.98h2.98l1.72-2h8l1.681,2H24.7L18.42,13.24 C17.66,13.64,16.859,13.84,16.04,13.84z M16.02,14.8l2.02,7.2h-4L16.02,14.8z M12.04,25.98l2-2h4l2,2H12.04z"></path>
					<path class="wave a" d="M4.66,1.04c-0.508-0.508-1.332-0.508-1.84,0c-1.86,1.92-2.8,4.44-2.8,6.94c0,2.52,0.94,5.04,2.8,6.96 c0.5,0.52,1.32,0.52,1.82,0s0.5-1.36,0-1.88C3.28,11.66,2.6,9.82,2.6,7.98S3.28,4.3,4.64,2.9C5.157,2.391,5.166,1.56,4.66,1.04z"></path>
					<path class="wave b" d="M9.58,12.22c0.5-0.5,0.5-1.34,0-1.84C8.94,9.72,8.62,8.86,8.62,8s0.32-1.72,0.96-2.38c0.5-0.52,0.5-1.34,0-1.84 C9.346,3.534,9.02,3.396,8.68,3.4c-0.32,0-0.66,0.12-0.9,0.38C6.64,4.94,6.08,6.48,6.08,8s0.58,3.06,1.7,4.22 C8.28,12.72,9.1,12.72,9.58,12.22z"></path>
					<path class="wave c" d="M22.42,3.78c-0.5,0.5-0.5,1.34,0,1.84c0.641,0.66,0.96,1.52,0.96,2.38s-0.319,1.72-0.96,2.38c-0.5,0.52-0.5,1.34,0,1.84 c0.487,0.497,1.285,0.505,1.781,0.018c0.007-0.006,0.013-0.012,0.02-0.018c1.139-1.16,1.699-2.7,1.699-4.22s-0.561-3.06-1.699-4.22 c-0.494-0.497-1.297-0.5-1.794-0.007C22.424,3.775,22.422,3.778,22.42,3.78z"></path>
					<path class="wave d" d="M29.18,1.06c-0.479-0.502-1.273-0.522-1.775-0.044c-0.016,0.015-0.029,0.029-0.045,0.044c-0.5,0.52-0.5,1.36,0,1.88 c1.361,1.4,2.041,3.24,2.041,5.08s-0.68,3.66-2.041,5.08c-0.5,0.52-0.5,1.36,0,1.88c0.509,0.508,1.332,0.508,1.841,0 c1.86-1.92,2.8-4.44,2.8-6.96C31.99,5.424,30.98,2.931,29.18,1.06z"></path>
				</svg>
			</div>
			<p class="fetching" v-if="fetching">{{ $t('fetching') }}<mk-ellipsis/></p>
			<h1 v-if="!fetching">{{ announcements.length == 0 ? $t('no-broadcasts') : announcements[i].title }}</h1>
			<p v-if="!fetching">
				<span v-if="announcements.length != 0" v-html="announcements[i].text"></span>
				<template v-if="announcements.length == 0">{{ $t('have-a-nice-day') }}</template>
			</p>
			<a v-if="announcements.length > 1" @click="next">{{ $t('next') }} &gt;&gt;</a>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'broadcast',
	props: () => ({
		design: 0
	})
}).extend({
	i18n: i18n('common/views/widgets/broadcast.vue'),
	data() {
		return {
			i: 0,
			fetching: true,
			announcements: []
		};
	},
	mounted() {
		this.$root.getMeta().then(meta => {
			this.announcements = meta.announcements;
			this.fetching = false;
		});
	},
	methods: {
		next() {
			if (this.i == this.announcements.length - 1) {
				this.i = 0;
			} else {
				this.i++;
			}
		},
		func() {
			if (this.props.design == 1) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		}
	}
});
</script>

<style lang="stylus" scoped>
.anltbovirfeutcigvwgmgxipejaeozxi-body
	padding 10px
	background var(--announcementsBg)

	&[data-melt]
		background transparent

	&[data-found]
		padding-left 50px

		> .icon
			display block

	&:after
		content ""
		display block
		clear both

	> .icon
		display none
		float left
		margin-left -40px

		> svg
			fill currentColor
			color #4078c0

			> .wave
				opacity 1

				&.a
					animation wave 20s ease-in-out 2.1s infinite
				&.b
					animation wave 20s ease-in-out 2s infinite
				&.c
					animation wave 20s ease-in-out 2s infinite
				&.d
					animation wave 20s ease-in-out 2.1s infinite

				@keyframes wave
					0%
						opacity 1
					1.5%
						opacity 0
					3.5%
						opacity 0
					5%
						opacity 1
					6.5%
						opacity 0
					8.5%
						opacity 0
					10%
						opacity 1

	> h1
		margin 0
		font-size 0.95em
		font-weight normal
		color var(--announcementsTitle)

	> p
		display block
		z-index 1
		margin 0
		font-size 0.7em
		color var(--announcementsText)

		&.fetching
			text-align center

	> a
		display block
		font-size 0.7em

	&[data-mobile]
		> p
			color #fff

</style>
