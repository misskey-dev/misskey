<mk-index>
	<mk-header/>
	<hr>
	<button @click="n">%i18n:ch.tags.mk-index.new%</button>
	<hr>
	<ul v-if="channels">
		<li each={ channels }><a href={ '/' + this.id }>{ this.title }</a></li>
	</ul>
	<style lang="stylus" scoped>
		:scope
			display block

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.on('mount', () => {
			this.$root.$data.os.api('channels', {
				limit: 100
			}).then(channels => {
				this.update({
					channels: channels
				});
			});
		});

		this.n = () => {
			const title = window.prompt('%i18n:ch.tags.mk-index.channel-title%');

			this.$root.$data.os.api('channels/create', {
				title: title
			}).then(channel => {
				location.href = '/' + channel.id;
			});
		};
	</script>
</mk-index>
