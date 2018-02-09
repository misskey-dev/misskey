<mk-post-menu>
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover { compact: opts.compact }" ref="popover">
		<button v-if="post.user_id === I.id" @click="pin">%i18n:common.tags.mk-post-menu.pin%</button>
		<div v-if="I.is_pro && !post.is_category_verified">
			<select ref="categorySelect">
				<option value="">%i18n:common.tags.mk-post-menu.select%</option>
				<option value="music">%i18n:common.post_categories.music%</option>
				<option value="game">%i18n:common.post_categories.game%</option>
				<option value="anime">%i18n:common.post_categories.anime%</option>
				<option value="it">%i18n:common.post_categories.it%</option>
				<option value="gadgets">%i18n:common.post_categories.gadgets%</option>
				<option value="photography">%i18n:common.post_categories.photography%</option>
			</select>
			<button @click="categorize">%i18n:common.tags.mk-post-menu.categorize%</button>
		</div>
	</div>
	<style lang="stylus" scoped>
		$border-color = rgba(27, 31, 35, 0.15)

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
				opacity 0

			> .popover
				position absolute
				z-index 10001
				background #fff
				border 1px solid $border-color
				border-radius 4px
				box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
				transform scale(0.5)
				opacity 0

				$balloon-size = 16px

				&:not(.compact)
					margin-top $balloon-size
					transform-origin center -($balloon-size)

					&:before
						content ""
						display block
						position absolute
						top -($balloon-size * 2)
						left s('calc(50% - %s)', $balloon-size)
						border-top solid $balloon-size transparent
						border-left solid $balloon-size transparent
						border-right solid $balloon-size transparent
						border-bottom solid $balloon-size $border-color

					&:after
						content ""
						display block
						position absolute
						top -($balloon-size * 2) + 1.5px
						left s('calc(50% - %s)', $balloon-size)
						border-top solid $balloon-size transparent
						border-left solid $balloon-size transparent
						border-right solid $balloon-size transparent
						border-bottom solid $balloon-size #fff

				> button
					display block

	</style>
	<script lang="typescript">
		import anime from 'animejs';

		this.mixin('i');
		this.mixin('api');

		this.post = this.opts.post;
		this.source = this.opts.source;

		this.on('mount', () => {
			const rect = this.source.getBoundingClientRect();
			const width = this.$refs.popover.offsetWidth;
			const height = this.$refs.popover.offsetHeight;
			if (this.opts.compact) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				this.$refs.popover.style.left = (x - (width / 2)) + 'px';
				this.$refs.popover.style.top = (y - (height / 2)) + 'px';
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				this.$refs.popover.style.left = (x - (width / 2)) + 'px';
				this.$refs.popover.style.top = y + 'px';
			}

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

		this.pin = () => {
			this.api('i/pin', {
				post_id: this.post.id
			}).then(() => {
				if (this.opts.cb) this.opts.cb('pinned', '%i18n:common.tags.mk-post-menu.pinned%');
				this.$destroy();
			});
		};

		this.categorize = () => {
			const category = this.$refs.categorySelect.options[this.$refs.categorySelect.selectedIndex].value;
			this.api('posts/categorize', {
				post_id: this.post.id,
				category: category
			}).then(() => {
				if (this.opts.cb) this.opts.cb('categorized', '%i18n:common.tags.mk-post-menu.categorized%');
				this.$destroy();
			});
		};

		this.close = () => {
			this.$refs.backdrop.style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: 200,
				easing: 'linear'
			});

			this.$refs.popover.style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: 200,
				easing: 'easeInBack',
				complete: () => this.$destroy()
			});
		};
	</script>
</mk-post-menu>
