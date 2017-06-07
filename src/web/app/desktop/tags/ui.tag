<mk-ui>
	<mk-ui-header page={ opts.page }/>
	<mk-set-avatar-suggestion if={ SIGNIN && I.avatar_id == null }/>
	<mk-set-banner-suggestion if={ SIGNIN && I.banner_id == null }/>
	<div class="content">
		<yield />
	</div>
	<mk-stream-indicator/>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('i');

		this.openPostForm = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-post-form-window')));
		};

		this.on('mount', () => {
			document.addEventListener('keydown', this.onkeydown);
		});

		this.on('unmount', () => {
			document.removeEventListener('keydown', this.onkeydown);
		});

		this.onkeydown = e => {
			if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return;

			if (e.which == 80 || e.which == 78) { // p or n
				e.preventDefault();
				this.openPostForm();
			}
		};
	</script>
</mk-ui>
