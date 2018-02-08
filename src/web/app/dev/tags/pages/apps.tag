<mk-apps-page>
	<h1>アプリを管理</h1><a href="/app/new">アプリ作成</a>
	<div class="apps">
		<p v-if="fetching">読み込み中</p>
		<template v-if="!fetching">
			<p v-if="apps.length == 0">アプリなし</p>
			<ul v-if="apps.length > 0">
				<li each={ app in apps }><a href={ '/app/' + app.id }>
						<p class="name">{ app.name }</p></a></li>
			</ul>
		</template>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		this.mixin('api');

		this.fetching = true;

		this.on('mount', () => {
			this.api('my/apps').then(apps => {
				this.fetching = false
				this.apps = apps
				this.update({
					fetching: false,
					apps: apps
				});
			});
		});
	</script>
</mk-apps-page>
