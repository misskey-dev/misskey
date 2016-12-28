# Update Wallpaper
#================================

riot = require 'riot'
dialog = require './dialog.ls'
api = require '../../common/scripts/api.ls'

module.exports = (I, cb, file = null) ~>

	@set = (file) ~>
		api I, \i/appdata/set do
			data: JSON.stringify do
				wallpaper: file.id
		.then (i) ~>
			dialog do
				'<i class="fa fa-info-circle"></i>壁紙を更新しました'
				'新しい壁紙が反映されるまで時間がかかる場合があります。'
				[
					text: \はい
				]
			if cb? then cb i
		.catch (err) ~>
			console.error err
			#@opts.ui.trigger \notification 'Error!'

	if file?
		@set file
	else
		browser = document.body.append-child document.create-element \mk-select-file-from-drive-window
		browser = riot.mount browser, do
			multiple: false
			title: '<i class="fa fa-picture-o"></i>壁紙にする画像を選択'
		.0
		browser.one \selected (file) ~>
			@set file
