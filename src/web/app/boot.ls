#================================
# MISSKEY BOOT LOADER
#
# Misskeyを起動します。
# 1. 初期化
# 2. ユーザー取得(ログインしていれば)
# 3. アプリケーションをマウント
#================================

# LOAD DEPENDENCIES
#--------------------------------

riot = require \riot
require \velocity
log = require './common/scripts/log.ls'
api = require './common/scripts/api.ls'
signout = require './common/scripts/signout.ls'
generate-default-userdata = require './common/scripts/generate-default-userdata.ls'
mixins = require './common/mixins.ls'
check-for-update = require './common/scripts/check-for-update.ls'
require './common/tags.ls'

# MISSKEY ENTORY POINT
#--------------------------------

# for subdomains
document.domain = CONFIG.host

# ↓ iOS待ちPolyfill (SEE: http://caniuse.com/#feat=fetch)
require \fetch

# ↓ NodeList、HTMLCollectionで forEach を使えるようにする
if NodeList.prototype.for-each == undefined
	NodeList.prototype.for-each = Array.prototype.for-each
if HTMLCollection.prototype.for-each == undefined
	HTMLCollection.prototype.for-each = Array.prototype.for-each

# ↓ iOSでプライベートモードだとlocalStorageが使えないので既存のメソッドを上書きする
try
	local-storage.set-item \kyoppie \yuppie
catch e
	Storage.prototype.set-item = ~> # noop

# MAIN PROCESS
#--------------------------------

log "Misskey (aoi) v:#{VERSION}"

# Check for Update
check-for-update!

# Get token from cookie
i = ((document.cookie.match /i=(\w+)/) || [null null]).1

if i? then log "ME: #{i}"

# ユーザーをフェッチしてコールバックする
module.exports = (callback) ~>
	# Get cached account data
	cached-me = JSON.parse local-storage.get-item \me

	if cached-me?.data?.cache
		fetched cached-me

		# 後から新鮮なデータをフェッチ
		fetchme i, true, (fresh-data) ~>
			Object.assign cached-me, fresh-data
			cached-me.trigger \updated
	else
		# キャッシュ無効なのにキャッシュが残ってたら掃除
		if cached-me?
			local-storage.remove-item \me

		fetchme i, false, fetched

	function fetched me

		if me?
			riot.observable me

			if me.data.cache
				local-storage.set-item \me JSON.stringify me

				me.on \updated ~>
					# キャッシュ更新
					local-storage.set-item \me JSON.stringify me

			log "Fetched! Hello #{me.username}."

		# activate mixins
		mixins me

		# destroy loading screen
		init = document.get-element-by-id \init
		init.parent-node.remove-child init

		# set main element
		document.create-element \div
			..set-attribute \id \app
			.. |> document.body.append-child

		# Call main proccess
		try
			callback me
		catch error
			panic error

# ユーザーをフェッチしてコールバックする
function fetchme token, silent, cb
	me = null

	# Return when not signed in
	if not token? then return done!

	# Fetch user
	fetch "#{CONFIG.api.url}/i" do
		method: \POST
		headers:
			'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
		body: "i=#token"
	.then (res) ~>
		# When failed to authenticate user
		if res.status != 200 then signout!

		i <~ res.json!.then
		me := i
		me.token = token

		# initialize it if user data is empty
		if me.data? then done! else init!
	.catch ~>
		if not silent
			info = document.create-element \mk-core-error
				|> document.body.append-child
			riot.mount info, do
				retry: ~> fetchme token, false, cb
		else
			# noop

	function done
		if cb? then cb me

	function init
		data = generate-default-userdata!

		api token, \i/appdata/set do
			data: JSON.stringify data
		.then ~>
			me.data = data
			done!

function panic e
	console.error e
	document.body.innerHTML = '<div id="error"><p>致命的な問題が発生しました。</p></div>'
