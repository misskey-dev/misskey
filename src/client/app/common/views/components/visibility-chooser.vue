<template>
<div class="gqyayizv">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ isMobile: $root.isMobile }" ref="popover">
		<div @click="choose('public')" :class="{ active: v == 'public' }">
			<div><fa icon="globe"/></div>
			<div>
				<span>{{ $t('public') }}</span>
			</div>
		</div>
		<div @click="choose('home')" :class="{ active: v == 'home' }">
			<div><fa icon="home"/></div>
			<div>
				<span>{{ $t('home') }}</span>
				<span>{{ $t('home-desc') }}</span>
			</div>
		</div>
		<div @click="choose('followers')" :class="{ active: v == 'followers' }">
			<div><fa icon="unlock"/></div>
			<div>
				<span>{{ $t('followers') }}</span>
				<span>{{ $t('followers-desc') }}</span>
			</div>
		</div>
		<div @click="choose('specified')" :class="{ active: v == 'specified' }">
			<div><fa icon="envelope"/></div>
			<div>
				<span>{{ $t('specified') }}</span>
				<span>{{ $t('specified-desc') }}</span>
			</div>
		</div>
		<div @click="choose('local-public')" :class="{ active: v == 'local-public' }">
			<div><fa icon="globe"/></div>
			<div>
				<span>{{ $t('local-public') }}</span>
				<span>{{ $t('local-public-desc') }}</span>
			</div>
		</div>
		<div @click="choose('users')" :class="{ active: v == 'users' }">
			<div><fa icon="user-friends"/></div>
			<div>
				<span>{{ $t('users') }}</span>
				<span>{{ $t('users-desc') }}</span>
			</div>
		</div>
		<div @click="choose('local-home')" :class="{ active: v == 'local-home' }">
			<div><fa icon="home"/></div>
			<div>
				<span>{{ $t('local-home') }}</span>
			</div>
		</div>
		<div @click="choose('local-followers')" :class="{ active: v == 'local-followers' }">
			<div><fa icon="unlock"/></div>
			<div>
				<span>{{ $t('local-followers') }}</span>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import anime from 'animejs';

export default Vue.extend({
	i18n: i18n('common/views/components/visibility-chooser.vue'),
	props: {
		source: {
			required: true
		},
		currentVisibility: {
			type: String,
			required: false
		}
	},
	data() {
		return {
			v: this.$store.state.settings.rememberNoteVisibility ? (this.$store.state.device.visibility || this.$store.state.settings.defaultNoteVisibility) : (this.currentVisibility || this.$store.state.settings.defaultNoteVisibility)
		}
	},
	mounted() {
		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (this.$root.isMobile) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				left = (x - (width / 2));
				top = (y - (height / 2));
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				left = (x - (width / 2));
				top = y;
			}

			if (left + width > window.innerWidth) {
				left = window.innerWidth - width;
			}

			popover.style.left = left + 'px';
			popover.style.top = top + 'px';

			anime({
				targets: this.$refs.backdrop,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: 500
			});
		});
	},
	methods: {
		choose(visibility) {
			if (this.$store.state.settings.rememberNoteVisibility) {
				this.$store.commit('device/setVisibility', visibility);
			}
			this.$emit('chosen', visibility);
			this.destroyDom();
		},
		close() {
			(this.$refs.backdrop as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: 200,
				easing: 'linear'
			});

			(this.$refs.popover as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: 200,
				easing: 'easeInBack',
				complete: () => this.destroyDom()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.gqyayizv
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background var(--modalBackdrop)
		opacity 0

	> .popover
		$bgcolor = var(--popupBg)
		position absolute
		z-index 10001
		width 240px
		padding 8px 0
		background $bgcolor
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		&:not(.isMobile)
			$arrow-size = 10px

			margin-top $arrow-size
			transform-origin center -($arrow-size)

			&:before
				content ""
				display block
				position absolute
				top -($arrow-size * 2)
				left s('calc(50% - %s)', $arrow-size)
				border-top solid $arrow-size transparent
				border-left solid $arrow-size transparent
				border-right solid $arrow-size transparent
				border-bottom solid $arrow-size $bgcolor

		> div
			display flex
			padding 8px 14px
			font-size 12px
			color var(--popupFg)
			cursor pointer

			&:hover
				background var(--faceClearButtonHover)

			&:active
				background var(--faceClearButtonActive)

			&.active
				color var(--primaryForeground)
				background var(--primary)

			> *
				user-select none
				pointer-events none

			> *:first-child
				display flex
				justify-content center
				align-items center
				margin-right 10px
				width 16px

			> *:last-child
				flex 1 1 auto

				> span:first-child
					display block
					font-weight bold

				> span:last-child:not(:first-child)
					opacity 0.6

</style>
