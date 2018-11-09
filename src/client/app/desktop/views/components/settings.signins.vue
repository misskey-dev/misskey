<template>
<div class="root">
<div class="signins" v-if="signins.length != 0">
	<div v-for="signin in signins">
		<header @click="signin._show = !signin._show">
			<template v-if="signin.success"><fa icon="check"/></template>
			<template v-else><fa icon="times"/></template>
			<span class="ip">{{ signin.ip }}</span>
			<mk-time :time="signin.createdAt"/>
		</header>
		<div class="headers" v-show="signin._show">
			<!-- TODO -->
		</div>
	</div>
</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			signins: [],
			connection: null
		};
	},

	mounted() {
		this.$root.api('i/signin_history').then(signins => {
			this.signins = signins;
			this.fetching = false;
		});

		this.connection = this.$root.stream.useSharedConnection('main');

		this.connection.on('signin', this.onSignin);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onSignin(signin) {
			this.signins.unshift(signin);
		}
	}
});
</script>

<style lang="stylus" scoped>
.root
	> .signins
		> div
			border-bottom solid 1px #eee

			> header
				display flex
				padding 8px 0
				line-height 32px
				cursor pointer

				> [data-icon]
					margin-right 8px
					text-align left

					&.check
						color #0fda82

					&.times
						color #ff3100

				> .ip
					display inline-block
					text-align left
					padding 8px
					line-height 16px
					font-family monospace
					font-size 14px
					color #444
					background #f8f8f8
					border-radius 4px

				> .mk-time
					margin-left auto
					text-align right
					color #777

			> .headers
				overflow auto
				margin 0 0 16px 0
				max-height 100px
				white-space pre-wrap
				word-break break-all

</style>
