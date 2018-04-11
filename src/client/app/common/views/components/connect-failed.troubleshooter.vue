<template>
<div class="troubleshooter">
	<h1>%fa:wrench%%i18n:common.tags.mk-error.troubleshooter.title%</h1>
	<div>
		<p :data-wip="network == null">
			<template v-if="network != null">
				<template v-if="network">%fa:check%</template>
				<template v-if="!network">%fa:times%</template>
			</template>
			{{ network == null ? '%i18n:common.tags.mk-error.troubleshooter.checking-network%' : '%i18n:common.tags.mk-error.troubleshooter.network%' }}<mk-ellipsis v-if="network == null"/>
		</p>
		<p v-if="network == true" :data-wip="internet == null">
			<template v-if="internet != null">
				<template v-if="internet">%fa:check%</template>
				<template v-if="!internet">%fa:times%</template>
			</template>
			{{ internet == null ? '%i18n:common.tags.mk-error.troubleshooter.checking-internet%' : '%i18n:common.tags.mk-error.troubleshooter.internet%' }}<mk-ellipsis v-if="internet == null"/>
		</p>
		<p v-if="internet == true" :data-wip="server == null">
			<template v-if="server != null">
				<template v-if="server">%fa:check%</template>
				<template v-if="!server">%fa:times%</template>
			</template>
			{{ server == null ? '%i18n:common.tags.mk-error.troubleshooter.checking-server%' : '%i18n:common.tags.mk-error.troubleshooter.server%' }}<mk-ellipsis v-if="server == null"/>
		</p>
	</div>
	<p v-if="!end">%i18n:common.tags.mk-error.troubleshooter.finding%<mk-ellipsis/></p>
	<p v-if="network === false"><b>%fa:exclamation-triangle%%i18n:common.tags.mk-error.troubleshooter.no-network%</b><br>%i18n:common.tags.mk-error.troubleshooter.no-network-desc%</p>
	<p v-if="internet === false"><b>%fa:exclamation-triangle%%i18n:common.tags.mk-error.troubleshooter.no-internet%</b><br>%i18n:common.tags.mk-error.troubleshooter.no-internet-desc%</p>
	<p v-if="server === false"><b>%fa:exclamation-triangle%%i18n:common.tags.mk-error.troubleshooter.no-server%</b><br>%i18n:common.tags.mk-error.troubleshooter.no-server-desc%</p>
	<p v-if="server === true" class="success"><b>%fa:info-circle%%i18n:common.tags.mk-error.troubleshooter.success%</b><br>%i18n:common.tags.mk-error.troubleshooter.success-desc%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl } from '../../../config';

export default Vue.extend({
	data() {
		return {
			network: navigator.onLine,
			end: false,
			internet: null,
			server: null
		};
	},
	mounted() {
		if (!this.network) {
			this.end = true;
			return;
		}

		// Check internet connection
		fetch('https://google.com?rand=' + Math.random(), {
			mode: 'no-cors'
		}).then(() => {
			this.internet = true;

			// Check misskey server is available
			fetch(`${apiUrl}/meta`).then(() => {
				this.end = true;
				this.server = true;
			})
			.catch(() => {
				this.end = true;
				this.server = false;
			});
		})
		.catch(() => {
			this.end = true;
			this.internet = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.troubleshooter
	width 100%
	max-width 500px
	text-align left
	background #fff
	border-radius 8px
	border solid 1px #ddd

	> h1
		margin 0
		padding 0.6em 1.2em
		font-size 1em
		color #444
		border-bottom solid 1px #eee

		> [data-fa]
			margin-right 0.25em

	> div
		overflow hidden
		padding 0.6em 1.2em

		> p
			margin 0.5em 0
			font-size 0.9em
			color #444

			&[data-wip]
				color #888

			> [data-fa]
				margin-right 0.25em

				&.times
					color #e03524

				&.check
					color #84c32f

	> p
		margin 0
		padding 0.7em 1.2em
		font-size 1em
		color #444
		border-top solid 1px #eee

		> b
			> [data-fa]
				margin-right 0.25em

		&.success
			> b
				color #39adad

		&:not(.success)
			> b
				color #ad4339

</style>
