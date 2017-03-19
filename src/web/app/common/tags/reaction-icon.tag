<mk-reaction-icon>
	<virtual if={ opts.reaction == 'like' }>👍</virtual>
	<virtual if={ opts.reaction == 'love' }>❤️</virtual>
	<virtual if={ opts.reaction == 'laugh' }>😆</virtual>
	<virtual if={ opts.reaction == 'hmm' }>🤔</virtual>
	<virtual if={ opts.reaction == 'surprise' }>😮</virtual>
	<virtual if={ opts.reaction == 'congrats' }>🎉</virtual>
	<style>
		:scope
			display inline
	</style>
</mk-reaction-icon>
