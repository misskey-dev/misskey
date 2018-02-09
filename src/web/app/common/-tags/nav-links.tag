<mk-nav-links>
	<a href={ aboutUrl }>%i18n:common.tags.mk-nav-links.about%</a><i>・</i><a href={ _STATS_URL_ }>%i18n:common.tags.mk-nav-links.stats%</a><i>・</i><a href={ _STATUS_URL_ }>%i18n:common.tags.mk-nav-links.status%</a><i>・</i><a href="http://zawazawa.jp/misskey/">%i18n:common.tags.mk-nav-links.wiki%</a><i>・</i><a href="https://github.com/syuilo/misskey/blob/master/DONORS.md">%i18n:common.tags.mk-nav-links.donors%</a><i>・</i><a href="https://github.com/syuilo/misskey">%i18n:common.tags.mk-nav-links.repository%</a><i>・</i><a href={ _DEV_URL_ }>%i18n:common.tags.mk-nav-links.develop%</a><i>・</i><a href="https://twitter.com/misskey_xyz" target="_blank">Follow us on %fa:B twitter%</a>
	<style lang="stylus" scoped>
		:scope
			display inline
	</style>
	<script lang="typescript">
		this.aboutUrl = `${_DOCS_URL_}/${_LANG_}/about`;
	</script>
</mk-nav-links>
