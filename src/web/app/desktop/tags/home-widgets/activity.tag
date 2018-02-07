<mk-activity-home-widget>
	<mk-activity-widget design={ data.design } view={ data.view } user={ I } ref="activity"/>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		this.data = {
			view: 0,
			design: 0
		};

		this.mixin('widget');

		this.initializing = true;

		this.on('mount', () => {
			this.$refs.activity.on('view-changed', view => {
				this.data.view = view;
				this.save();
			});
		});

		this.func = () => {
			if (++this.data.design == 3) this.data.design = 0;
			this.$refs.activity.update({
				design: this.data.design
			});
			this.save();
		};
	</script>
</mk-activity-home-widget>
