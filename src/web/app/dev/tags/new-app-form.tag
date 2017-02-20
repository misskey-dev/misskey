<mk-new-app-form>
	<form onsubmit={ onsubmit } autocomplete="off">
		<section class="name">
			<label>
				<p class="caption">アプリケーション名</p>
				<input ref="name" type="text" placeholder="ex) Misskey for iOS" autocomplete="off" required="required"/>
			</label>
		</section>
		<section class="nid">
			<label>
				<p class="caption">Named ID</p>
				<input ref="nid" type="text" pattern="^[a-zA-Z0-9-]{3,30}$" placeholder="ex) misskey-for-ios" autocomplete="off" required="required" onkeyup={ onChangeNid }/>
				<p class="info" if={ nidState == 'wait' } style="color:#999"><i class="fa fa-fw fa-spinner fa-pulse"></i>確認しています...</p>
				<p class="info" if={ nidState == 'ok' } style="color:#3CB7B5"><i class="fa fa-fw fa-check"></i>利用できます</p>
				<p class="info" if={ nidState == 'unavailable' } style="color:#FF1161"><i class="fa fa-fw fa-exclamation-triangle"></i>既に利用されています</p>
				<p class="info" if={ nidState == 'error' } style="color:#FF1161"><i class="fa fa-fw fa-exclamation-triangle"></i>通信エラー</p>
				<p class="info" if={ nidState == 'invalid-format' } style="color:#FF1161"><i class="fa fa-fw fa-exclamation-triangle"></i>a~z、A~Z、0~9、-(ハイフン)が使えます</p>
				<p class="info" if={ nidState == 'min-range' } style="color:#FF1161"><i class="fa fa-fw fa-exclamation-triangle"></i>3文字以上でお願いします！</p>
				<p class="info" if={ nidState == 'max-range' } style="color:#FF1161"><i class="fa fa-fw fa-exclamation-triangle"></i>30文字以内でお願いします</p>
			</label>
		</section>
		<section class="description">
			<label>
				<p class="caption">アプリの概要</p>
				<textarea ref="description" placeholder="ex) Misskey iOSクライアント。" autocomplete="off" required="required"></textarea>
			</label>
		</section>
		<section class="callback">
			<label>
				<p class="caption">コールバックURL (オプション)</p>
				<input ref="cb" type="url" placeholder="ex) https://your.app.example.com/callback.php" autocomplete="off"/>
			</label>
		</section>
		<section class="permission">
			<p class="caption">権限</p>
			<div ref="permission">
				<label>
					<input type="checkbox" value="account-read"/>
					<p>アカウントの情報を見る。</p>
				</label>
				<label>
					<input type="checkbox" value="account-write"/>
					<p>アカウントの情報を操作する。</p>
				</label>
				<label>
					<input type="checkbox" value="post-write"/>
					<p>投稿する。</p>
				</label>
				<label>
					<input type="checkbox" value="like-write"/>
					<p>いいねしたりいいね解除する。</p>
				</label>
				<label>
					<input type="checkbox" value="following-write"/>
					<p>フォローしたりフォロー解除する。</p>
				</label>
				<label>
					<input type="checkbox" value="drive-read"/>
					<p>ドライブを見る。</p>
				</label>
				<label>
					<input type="checkbox" value="drive-write"/>
					<p>ドライブを操作する。</p>
				</label>
				<label>
					<input type="checkbox" value="notification-read"/>
					<p>通知を見る。</p>
				</label>
				<label>
					<input type="checkbox" value="notification-write"/>
					<p>通知を操作する。</p>
				</label>
			</div>
			<p><i class="fa fa-exclamation-triangle"></i>アプリ作成後も変更できますが、新たな権限を付与する場合、その時点で関連付けられているユーザーキーはすべて無効になります。</p>
		</section>
		<button onclick={ onsubmit }>アプリ作成</button>
	</form>
	<style>
		:scope
			display block
			overflow hidden

			> form

				section
					display block
					margin 16px 0

					.caption
						margin 0 0 4px 0
						color #616161
						font-size 0.95em

						> i
							margin-right 0.25em
							color #96adac

					.info
						display block
						margin 4px 0
						font-size 0.8em

						> i
							margin-right 0.3em

				section.permission
					div
						padding 8px 0
						max-height 160px
						overflow auto
						background #fff
						border solid 1px #cecece
						border-radius 4px

					label
						display block
						padding 0 12px
						line-height 32px
						cursor pointer

						&:hover
							> p
								color #999

							[type='checkbox']:checked + p
								color #000

						[type='checkbox']
							margin-right 4px

						[type='checkbox']:checked + p
							color #111

						> p
							display inline
							color #aaa
							user-select none

					> p:last-child
						margin 6px
						font-size 0.8em
						color #999

						> i
							margin-right 4px

				[type=text]
				[type=url]
				textarea
					user-select text
					display inline-block
					cursor auto
					padding 8px 12px
					margin 0
					width 100%
					font-size 1em
					color #333
					background #fff
					outline none
					border solid 1px #cecece
					border-radius 4px

					&:hover
						border-color #bbb

					&:focus
						border-color $theme-color

					&:disabled
						opacity 0.5

				> button
					margin 20px 0 32px 0
					width 100%
					font-size 1em
					color #111
					border-radius 3px

	</style>
	<script>
		this.mixin('api');

		this.nid-state = null

		on-change-nid() {
			nid = this.refs.nid.value

			if nid == ''
				this.nid-state = null
				this.update();
				return

			err = switch
				| not nid.match /^[a-zA-Z0-9\-]+$/ => 'invalid-format' 
				| nid.length < 3chars              => 'min-range' 
				| nid.length > 30chars             => 'max-range' 
				| _                                     => null

			if err?
				this.nid-state = err
				this.update();
			else
				this.nid-state = 'wait' 
				this.update();

				this.api 'app/name_id/available' do
					name_id: nid
				.then (result) =>
					if result.available
						this.nid-state = 'ok' 
					else
						this.nid-state = 'unavailable' 
					this.update();
				.catch (err) =>
					this.nid-state = 'error' 
					this.update();

		onsubmit() {
			name = this.refs.name.value
			nid = this.refs.nid.value
			description = this.refs.description.value
			cb = this.refs.cb.value
			permission = []

			this.refs.permission.query-selector-all 'input' .for-each (el) =>
				if el.checked then permission.push el.value

			locker = document.body.appendChild document.createElement 'mk-locker' 

			this.api 'app/create' do
				name: name
				name_id: nid
				description: description
				callback_url: cb
				permission: permission.join ',' 
			.then =>
				location.href = '/apps'
			.catch =>
				alert 'アプリの作成に失敗しました。再度お試しください。'

				locker.parent-node.remove-child locker
	</script>
</mk-new-app-form>
