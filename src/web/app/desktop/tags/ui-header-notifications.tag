<mk-ui-header-notifications>
	<button class="header" data-active={ isOpen } onclick={ toggle }><i class="fa fa-bell-o"></i></button>
	<div class="notifications" if={ isOpen }>
		<mk-notifications></mk-notifications>
	</div>
	<style>
		:scope
			display block
			float left

			> .header
				display block
				margin 0
				padding 0
				width 32px
				color #dbe2e0
				border none
				background transparent
				cursor pointer

				*
					pointer-events none

				&:hover
				&[data-active='true']
					color #fff

				> i
					font-size 1.2em
					line-height 48px

			> .notifications
				display block
				position absolute
				top 56px
				right -72px
				width 300px
				background #fff
				border-radius 4px
				box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

				&:before
					content ""
					pointer-events none
					display block
					position absolute
					top -28px
					right 74px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px rgba(0, 0, 0, 0.1)
					border-left solid 14px transparent

				&:after
					content ""
					pointer-events none
					display block
					position absolute
					top -27px
					right 74px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px #fff
					border-left solid 14px transparent

				> mk-notifications
					max-height 350px
					font-size 1rem
					overflow auto

	</style>
	<script>
		import contains from '../../common/scripts/contains';

		this.isOpen = false;

		this.toggle = () => {
			this.isOpen ? this.close() : this.open();
		};

		this.open = () => {
			this.update({
				isOpen: true
			});
			document.querySelectorAll('body *').forEach(el => {
				el.addEventListener('mousedown', this.mousedown);
			});
		};

		this.close = () => {
			this.update({
				isOpen: false
			});
			document.querySelectorAll('body *').forEach(el => {
				el.removeEventListener('mousedown', this.mousedown);
			});
		};

		this.mousedown = e => {
			e.preventDefault();
			if (!contains(this.root, e.target) && this.root != e.target) this.close();
			return false;
		};
	</script>
</mk-ui-header-notifications>
