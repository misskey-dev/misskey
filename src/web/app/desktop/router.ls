# Router
#================================

riot = require \riot
route = require \page
page = null

module.exports = (me) ~>

	# Routing
	#--------------------------------

	route \/ index
	route \/i>mentions mentions
	route \/post::post post
	route \/search::query search
	route \/:user user.bind null \home
	route \/:user/graphs user.bind null \graphs
	route \/:user/:post post
	route \* not-found

	# Handlers
	#--------------------------------

	function index
		if me? then home! else entrance!

	function home
		mount document.create-element \mk-home-page

	function entrance
		mount document.create-element \mk-entrance
		document.document-element.set-attribute \data-page \entrance

	function mentions
		document.create-element \mk-home-page
			..set-attribute \mode \mentions
			.. |> mount

	function search ctx
		document.create-element \mk-search-page
			..set-attribute \query ctx.params.query
			.. |> mount

	function user page, ctx
		document.create-element \mk-user-page
			..set-attribute \user ctx.params.user
			..set-attribute \page page
			.. |> mount

	function post ctx
		document.create-element \mk-post-page
			..set-attribute \post ctx.params.post
			.. |> mount

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
	document.document-element.remove-attribute \data-page
	if page? then page.unmount!
	body = document.get-element-by-id \app
	page := riot.mount body.append-child content .0
