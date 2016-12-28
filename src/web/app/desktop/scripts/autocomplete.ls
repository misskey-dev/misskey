# Autocomplete
#================================

get-caret-coordinates = require 'textarea-caret-position'
riot = require 'riot'

# オートコンプリートを管理するクラスです。
class Autocomplete

	@textarea = null
	@suggestion = null

	# 対象のテキストエリアを与えてインスタンスを初期化します。
	(textarea) ~>
		@textarea = textarea

	# このインスタンスにあるテキストエリアの入力のキャプチャを開始します。
	attach: ~>
		@textarea.add-event-listener \input @on-input

	# このインスタンスにあるテキストエリアの入力のキャプチャを解除します。
	detach: ~>
		@textarea.remove-event-listener \input @on-input
		@close!

	# テキスト入力時
	on-input: ~>
		@close!

		caret = @textarea.selection-start
		text = @textarea.value.substr 0 caret

		mention-index = text.last-index-of \@

		if mention-index == -1
			return

		username = text.substr mention-index + 1

		if not username.match /^[a-zA-Z0-9-]+$/
			return

		@open \user username

	# サジェストを提示します。
	open: (type, q) ~>
		# 既に開いているサジェストは閉じる
		@close!

		# サジェスト要素作成
		suggestion = document.create-element \mk-autocomplete-suggestion

		# ~ サジェストを表示すべき位置を計算 ~

		caret-position = get-caret-coordinates @textarea, @textarea.selection-start

		rect = @textarea.get-bounding-client-rect!

		x = rect.left + window.page-x-offset + caret-position.left
		y = rect.top + window.page-y-offset + caret-position.top

		suggestion.style.left = x + \px
		suggestion.style.top = y + \px

		# 要素追加
		el = document.body.append-child suggestion

		# マウント
		mounted = riot.mount el, do
			textarea: @textarea
			complete: @complete
			close: @close
			type: type
			q: q

		@suggestion = mounted.0

	# サジェストを閉じます。
	close: ~>
		if !@suggestion?
			return

		@suggestion.unmount!
		@suggestion = null

		@textarea.focus!

	# オートコンプリートする
	complete: (user) ~>
		@close!
		value = user.username

		caret = @textarea.selection-start
		source = @textarea.value

		before = source.substr 0 caret
		trimed-before = before.substring 0 before.last-index-of \@
		after = source.substr caret

		# 結果を挿入する
		@textarea.value = trimed-before + \@ + value + ' ' + after

		# キャレットを戻す
		@textarea.focus!
		pos = caret + value.length
		@textarea.set-selection-range pos, pos

module.exports = Autocomplete
