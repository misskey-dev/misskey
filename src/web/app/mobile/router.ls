# Router
#================================

riot = require \riot
route = require \page
page = null

module.exports = (me) ~>

	# Routing
	#--------------------------------

	route \/ index
	route \/i/notifications notifications
	route \/i/drive drive
	route \/i/drive/folder/:folder drive
	route \/i/drive/file/:file drive
	route \/post/new new-post
	route \/post::post post
	route \/search::query search
	route \/:user user.bind null \posts
	route \/:user/graphs user.bind null \graphs
	route \/:user/followers user-followers
	route \/:user/following user-following
	route \/:user/:post post
	route \* not-found

	# Handlers
	#--------------------------------

	# /
	function index
		if me? then home! else entrance!

	# ホーム
	function home
		mount document.create-element \mk-home-page

	# 玄関
	function entrance
		mount document.create-element \mk-entrance

	# 通知
	function notifications
		mount document.create-element \mk-notifications-page

	# 新規投稿
	function new-post
		mount document.create-element \mk-new-post-page

	# 検索
	function search ctx
		document.create-element \mk-search-page
			..set-attribute \query ctx.params.query
			.. |> mount

	# ユーザー
	function user page, ctx
		document.create-element \mk-user-page
			..set-attribute \user ctx.params.user
			..set-attribute \page page
			.. |> mount

	# フォロー一覧
	function user-following ctx
		document.create-element \mk-user-following-page
			..set-attribute \user ctx.params.user
			.. |> mount

	# フォロワー一覧
	function user-followers ctx
		document.create-element \mk-user-followers-page
			..set-attribute \user ctx.params.user
			.. |> mount

	# 投稿詳細ページ
	function post ctx
		document.create-element \mk-post-page
			..set-attribute \post ctx.params.post
			.. |> mount

	# ドライブ
	function drive ctx
		p = document.create-element \mk-drive-page
		if ctx.params.folder then p.set-attribute \folder ctx.params.folder
		if ctx.params.file then p.set-attribute \file ctx.params.file
		mount p

	# not found
	function not-found
		mount document.create-element \mk-not-found

	# Register mixin
	#--------------------------------

	riot.mixin \page do
		page: route

	# Exec
	#--------------------------------

	route!

# Mount
#================================

function mount content
	if page? then page.unmount!
	body = document.get-element-by-id \app
	page := riot.mount body.append-child content .0
