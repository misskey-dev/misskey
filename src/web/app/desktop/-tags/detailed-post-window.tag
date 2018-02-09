<mk-detailed-post-window>
	<div class="bg" ref="bg" @click="bgClick"></div>
	<div class="main" ref="main" v-if="!fetching">
		<mk-post-detail ref="detail" post={ post }/>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			opacity 0

			> .bg
				display block
				position fixed
				z-index 1000
				top 0
				left 0
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.7)

			> .main
				display block
				position fixed
				z-index 1000
				top 20%
				left 0
				right 0
				margin 0 auto 0 auto
				padding 0
				width 638px
				text-align center

				> mk-post-detail
					margin 0 auto

	</style>
	<script lang="typescript">
		import anime from 'animejs';

		this.mixin('api');

		this.fetching = true;
		this.post = null;

		this.on('mount', () => {
			anime({
				targets: this.root,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			this.api('posts/show', {
				post_id: this.opts.post
			}).then(post => {

				this.update({
					fetching: false,
					post: post
				});
			});
		});

		this.close = () => {
			this.$refs.bg.style.pointerEvents = 'none';
			this.$refs.main.style.pointerEvents = 'none';
			anime({
				targets: this.root,
				opacity: 0,
				duration: 300,
				easing: 'linear',
				complete: () => this.$destroy()
			});
		};

		this.bgClick = () => {
			this.close();
		};
	</script>
</mk-detailed-post-window>
