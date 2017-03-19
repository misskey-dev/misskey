<mk-reactions-viewer>
	<virtual if={ reactions }>
		<span if={ reactions.like }><mk-reaction-icon reaction='like'></mk-reaction-icon><span>{ reactions.like }</span></span>
		<span if={ reactions.love }><mk-reaction-icon reaction='love'></mk-reaction-icon><span>{ reactions.love }</span></span>
		<span if={ reactions.laugh }><mk-reaction-icon reaction='laugh'></mk-reaction-icon><span>{ reactions.laugh }</span></span>
		<span if={ reactions.hmm }><mk-reaction-icon reaction='hmm'></mk-reaction-icon><span>{ reactions.hmm }</span></span>
		<span if={ reactions.surprise }><mk-reaction-icon reaction='surprise'></mk-reaction-icon><span>{ reactions.surprise }</span></span>
		<span if={ reactions.congrats }><mk-reaction-icon reaction='congrats'></mk-reaction-icon><span>{ reactions.congrats }</span></span>
	</virtual>
	<style>
		:scope
			display block

			> span
				margin-right 8px

				> mk-reaction-icon
					font-size 20px

				> span
					margin-left 4px
					font-size 16px
					color #444

	</style>
	<script>
		this.post = this.opts.post;

		this.on('mount', () => {
			this.update();
		});

		this.on('update', () => {
			this.reactions = this.post.reaction_counts;
		});
	</script>
</mk-reactions-viewer>
