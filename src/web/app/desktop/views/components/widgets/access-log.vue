<template>
<div class="mkw-access-log">
	<template v-if="props.design == 0">
		<p class="title">%fa:server%%i18n:desktop.tags.mk-access-log-home-widget.title%</p>
	</template>
	<div ref="log">
		<p v-for="req in requests">
			<span class="ip" :style="`color:${ req.fg }; background:${ req.bg }`">{{ req.ip }}</span>
			<b>{{ req.method }}</b>
			<span>{{ req.path }}</span>
		</p>
	</div>
</div>
</template>

<script lang="ts">
import define from '../../../../common/define-widget';
import * as seedrandom from 'seedrandom';

export default define({
	name: 'broadcast',
	props: () => ({
		design: 0
	})
}).extend({
	data() {
		return {
			requests: [],
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		this.connection = (this as any).os.streams.requestsStream.getConnection();
		this.connectionId = (this as any).os.streams.requestsStream.use();
		this.connection.on('request', this.onRequest);
	},
	beforeDestroy() {
		this.connection.off('request', this.onRequest);
		(this as any).os.streams.requestsStream.dispose(this.connectionId);
	},
	methods: {
		onRequest(request) {
			const random = seedrandom(request.ip);
			const r = Math.floor(random() * 255);
			const g = Math.floor(random() * 255);
			const b = Math.floor(random() * 255);
			const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b); // SMPTE C, Rec. 709 weightings
			request.bg = `rgb(${r}, ${g}, ${b})`;
			request.fg = luma >= 165 ? '#000' : '#fff';

			this.requests.push(request);
			if (this.requests.length > 30) this.requests.shift();

			(this.$refs.log as any).scrollTop = (this.$refs.log as any).scrollHeight;
		},
		func() {
			if (this.props.design == 1) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-access-log
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
				padding 0 4px

			> b
				margin-right 4px

</style>
