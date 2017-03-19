<mk-reaction-picker>
	<div class="backdrop" onclick={ unmount }></div>
	<div class="popover" ref="popover">
		<button onclick={ react.bind(null, 'like') } tabindex="1" title="いいね"><mk-reaction-icon reaction='like'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'love') } tabindex="2" title="ハート"><mk-reaction-icon reaction='love'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'laugh') } tabindex="3" title="笑"><mk-reaction-icon reaction='laugh'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'hmm') } tabindex="4" title="ふぅ～む"><mk-reaction-icon reaction='hmm'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'surprise') } tabindex="5" title="驚き"><mk-reaction-icon reaction='surprise'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'congrats') } tabindex="6" title="おめでとう"><mk-reaction-icon reaction='congrats'></mk-reaction-icon></button>
	</div>
	<style>
		:scope
			display block
			position initial

			> .backdrop
				position fixed
				top 0
				left 0
				z-index 10000
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.1)

			> .popover
				position absolute
				z-index 10001
				background #fff
				border 1px solid rgba(27, 31, 35, 0.15)
				border-radius 4px
				box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)

				> button
					font-size 24px

	</style>
	<script>
		this.mixin('api');

		this.post = this.opts.post;

		this.on('mount', () => {
			const width = this.refs.popover.offsetWidth;
			this.refs.popover.style.top = this.opts.top + 'px';
			this.refs.popover.style.left = (this.opts.left - (width / 2)) + 'px';
		});

		this.react = reaction => {
			this.api('posts/reactions/create', {
				post_id: this.post.id,
				reaction: reaction
			}).then(() => {
				if (this.opts.cb) this.opts.cb();
				this.unmount();
			});
		};
	</script>
</mk-reaction-picker>
