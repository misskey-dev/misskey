<mk-reaction-icon>
	<virtual if={ opts.reaction == 'like' }><img src="/assets/reactions/like" alt="%i18n:common.reactions.like%"></virtual>
	<virtual if={ opts.reaction == 'love' }><img src="/assets/reactions/love" alt="%i18n:common.reactions.love%"></virtual>
	<virtual if={ opts.reaction == 'laugh' }><img src="/assets/reactions/laugh" alt="%i18n:common.reactions.laugh%"></virtual>
	<virtual if={ opts.reaction == 'hmm' }><img src="/assets/reactions/hmm" alt="%i18n:common.reactions.hmm%"></virtual>
	<virtual if={ opts.reaction == 'surprise' }><img src="/assets/reactions/surprise" alt="%i18n:common.reactions.surprise%"></virtual>
	<virtual if={ opts.reaction == 'congrats' }><img src="/assets/reactions/congrats" alt="%i18n:common.reactions.congrats%"></virtual>
	<style>
		:scope
			display inline
	</style>
</mk-reaction-icon>
