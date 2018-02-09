<mk-access-log-home-widget>
	<template v-if="data.design == 0">
		<p class="title">%fa:server%%i18n:desktop.tags.mk-access-log-home-widget.title%</p>
	</template>
	<div ref="log">
		<p each={ requests }>
			<span class="ip" style="color:{ fg }; background:{ bg }">{ ip }</span>
			<span>{ method }</span>
			<span>{ path }</span>
		</p>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			overflow hidden
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> [data-fa]
					margin-right 4px

			> div
				max-height 250px
				overflow auto

				> p
					margin 0
					padding 8px
					font-size 0.8em
					color #555

					&:nth-child(odd)
						background rgba(0, 0, 0, 0.025)

					> .ip
						margin-right 4px

	</style>
	<script lang="typescript">
		import seedrandom from 'seedrandom';

		this.data = {
			design: 0
		};

		this.mixin('widget');

		this.mixin('requests-stream');
		this.connection = this.requestsStream.getConnection();
		this.connectionId = this.requestsStream.use();

		this.requests = [];

		this.on('mount', () => {
			this.connection.on('request', this.onRequest);
		});

		this.on('unmount', () => {
			this.connection.off('request', this.onRequest);
			this.requestsStream.dispose(this.connectionId);
		});

		this.onRequest = request => {
			const random = seedrandom(request.ip);
			const r = Math.floor(random() * 255);
			const g = Math.floor(random() * 255);
			const b = Math.floor(random() * 255);
			const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b); // SMPTE C, Rec. 709 weightings
			request.bg = `rgb(${r}, ${g}, ${b})`;
			request.fg = luma >= 165 ? '#000' : '#fff';

			this.requests.push(request);
			if (this.requests.length > 30) this.requests.shift();
			this.update();

			this.$refs.log.scrollTop = this.$refs.log.scrollHeight;
		};

		this.func = () => {
			if (++this.data.design == 2) this.data.design = 0;
			this.save();
		};
	</script>
</mk-access-log-home-widget>
