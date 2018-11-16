<template>
<div class="troubleshooter">
	<div class="body">
		<h1><fa icon="wrench"/>{{ $t('title') }}</h1>
		<div>
			<p :data-wip="network == null">
				<template v-if="network != null">
					<template v-if="network"><fa icon="check"/></template>
					<template v-if="!network"><fa icon="times"/></template>
				</template>
				{{ network == null ? this.$t('checking-network') : this.$t('network') }}<mk-ellipsis v-if="network == null"/>
			</p>
			<p v-if="network == true" :data-wip="internet == null">
				<template v-if="internet != null">
					<template v-if="internet"><fa icon="check"/></template>
					<template v-if="!internet"><fa icon="times"/></template>
				</template>
				{{ internet == null ? this.$t('checking-internet') : this.$t('internet') }}<mk-ellipsis v-if="internet == null"/>
			</p>
			<p v-if="internet == true" :data-wip="server == null">
				<template v-if="server != null">
					<template v-if="server"><fa icon="check"/></template>
					<template v-if="!server"><fa icon="times"/></template>
				</template>
				{{ server == null ? this.$t('checking-server') : this.$t('server') }}<mk-ellipsis v-if="server == null"/>
			</p>
		</div>
		<p v-if="!end">{{ $t('finding') }}<mk-ellipsis/></p>
		<p v-if="network === false"><b><fa icon="exclamation-triangle"/>{{ $t('no-network') }}</b><br>{{ $t('no-network-desc') }}</p>
		<p v-if="internet === false"><b><fa icon="exclamation-triangle"/>{{ $t('no-internet') }}</b><br>{{ $t('no-internet-desc') }}</p>
		<p v-if="server === false"><b><fa icon="exclamation-triangle"/>{{ $t('no-server') }}</b><br>{{ $t('no-server-desc') }}</p>
		<p v-if="server === true" class="success"><b><fa icon="info-circle"/>{{ $t('success') }}</b><br>{{ $t('success-desc') }}</p>
	</div>
	<footer>
		<a href="/assets/flush.html">{{ $t('flush') }}</a> | <a href="/assets/version.html">{{ $t('set-version') }}</a>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/connect-failed.troubleshooter.vue'),
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
		fetch(`https://google.com?rand=${Math.random()}`, {
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
	margin-top 1em

	> .body
		width 100%
		max-width 500px
		margin 0 auto
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

			> [data-icon]
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

				> [data-icon]
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
				> [data-icon]
					margin-right 0.25em

			&.success
				> b
					color #39adad

			&:not(.success)
				> b
					color #ad4339

</style>
