# Router
#================================

route = require \page
page = null

module.exports = (me) ~>

	# Routing
	#--------------------------------

	route \/ index
	route \/apps apps
	route \/app/new new-app
	route \/app/:app app
	route \* not-found

	# Handlers
	#--------------------------------

	function index
		mount document.create-element \mk-index

	function apps
		mount document.create-element \mk-apps-page

	function new-app
		mount document.create-element \mk-new-app-page

	function app ctx
		document.create-element \mk-app-page
			..set-attribute \app ctx.params.app
			.. |> mount

	function not-found
		mount document.create-element \mk-not-found

	# Exec
	#--------------------------------

	route!

# Mount
#================================

riot = require \riot

function mount content
	if page? then page.unmount!
	body = document.get-element-by-id \app
	page := riot.mount body.append-child content .0
