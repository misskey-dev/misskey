# Update Banner
#================================

riot = require 'riot'
dialog = require './dialog.ls'
api = require '../../common/scripts/api.ls'

module.exports = (I, cb, file = null) ~>

	@file-selected = (file) ~>
		cropper = document.body.append-child document.create-element \mk-crop-window
		cropper = riot.mount cropper, do
			file: file
			title: 'バナーとして表示する部分を選択'
			aspect-ratio: 16 / 9
		.0
		cropper.on \cropped (blob) ~>
			data = new FormData!
			data.append \i I.token
			data.append \file blob, file.name + '.cropped.png'
			api I, \drive/folders/find do
				name: 'バナー'
			.then (banner-folder) ~>
				if banner-folder.length == 0
					api I, \drive/folders/create do
						name: 'バナー'
					.then (banner-folder) ~>
						@uplaod data, banner-folder
				else
					@uplaod data, banner-folder.0
		cropper.on \skiped ~>
			@set file

	@uplaod = (data, folder) ~>

		progress = document.body.append-child document.create-element \mk-progress-dialog
		progress = riot.mount progress, do
			title: '新しいバナーをアップロードしています'
		.0

		if folder?
			data.append \folder_id folder.id

		xhr = new XMLHttpRequest!
		xhr.open \POST CONFIG.api.url + \/drive/files/create true
		xhr.onload = (e) ~>
			file = JSON.parse e.target.response
			progress.close!
			@set file

		xhr.upload.onprogress = (e) ~>
			if e.length-computable
				progress.update-progress e.loaded, e.total

		xhr.send data

	@set = (file) ~>
		api I, \i/update do
			banner_id: file.id
		.then (i) ~>
			dialog do
				'<i class="fa fa-info-circle"></i>バナーを更新しました'
				'新しいバナーが反映されるまで時間がかかる場合があります。'
				[
					text: \わかりました。
				]
			if cb? then cb i
		.catch (err) ~>
			console.error err
			#@opts.ui.trigger \notification 'Error!'

	if file?
		@file-selected file
	else
		browser = document.body.append-child document.create-element \mk-select-file-from-drive-window
		browser = riot.mount browser, do
			multiple: false
			title: '<i class="fa fa-picture-o"></i>バナーにする画像を選択'
		.0
		browser.one \selected (file) ~>
			@file-selected file
