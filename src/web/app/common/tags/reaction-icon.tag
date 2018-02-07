<mk-reaction-icon>
	<virtual if={ opts.reaction == 'like' }><img src="/assets/reactions/like.png" alt="%i18n:common.reactions.like%"></virtual>
	<virtual if={ opts.reaction == 'love' }><img src="/assets/reactions/love.png" alt="%i18n:common.reactions.love%"></virtual>
	<virtual if={ opts.reaction == 'laugh' }><img src="/assets/reactions/laugh.png" alt="%i18n:common.reactions.laugh%"></virtual>
	<virtual if={ opts.reaction == 'hmm' }><img src="/assets/reactions/hmm.png" alt="%i18n:common.reactions.hmm%"></virtual>
	<virtual if={ opts.reaction == 'surprise' }><img src="/assets/reactions/surprise.png" alt="%i18n:common.reactions.surprise%"></virtual>
	<virtual if={ opts.reaction == 'congrats' }><img src="/assets/reactions/congrats.png" alt="%i18n:common.reactions.congrats%"></virtual>
	<virtual if={ opts.reaction == 'angry' }><img src="/assets/reactions/angry.png" alt="%i18n:common.reactions.angry%"></virtual>
	<virtual if={ opts.reaction == 'confused' }><img src="/assets/reactions/confused.png" alt="%i18n:common.reactions.confused%"></virtual>
	<virtual if={ opts.reaction == 'pudding' }><img src="/assets/reactions/pudding.png" alt="%i18n:common.reactions.pudding%"></virtual>

	<style lang="stylus" scoped>
		:scope
			display inline

			img
				vertical-align middle
				width 1em
				height 1em
	</style>
</mk-reaction-icon>
