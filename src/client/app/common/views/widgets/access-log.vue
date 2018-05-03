<template>
<div class="mkw-access-log">
	<mk-widget-container :show-header="props.design == 0">
		<template slot="header">%fa:server%%i18n:@title%</template>

		<div :class="$style.logs" ref="log">
			<p v-for="req in requests">
				<span :class="$style.ip" :style="`color:${ req.fg }; background:${ req.bg }`">{{ req.ip }}</span>
				<b>{{ req.method }}</b>
				<span>{{ req.path }}</span>
			</p>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
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
			this.save();
		}
	}
});
</script>

<style lang="stylus" module>
.logs
	max-height 250px
	overflow auto

	> p
		margin 0
		padding 8px
		font-size 0.8em
		color #555

		&:nth-child(odd)
			background rgba(#000, 0.025)

		> b
			margin-right 4px

.ip
	margin-right 4px
	padding 0 4px

</style>
