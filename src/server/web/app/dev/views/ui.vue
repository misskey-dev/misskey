<template>
<div>
	<b-navbar toggleable="md" type="dark" variant="info">
		<b-navbar-brand>Misskey Developers</b-navbar-brand>
		<b-navbar-nav>
			<b-nav-item to="/">Home</b-nav-item>
			<b-nav-item to="/apps">Apps</b-nav-item>
		</b-navbar-nav>
	</b-navbar>
	<main>
		<slot></slot>
	</main>
</div>
</template>

<style lang="stylus" scoped>
main
	padding 32px
	max-width 700px
</style>
