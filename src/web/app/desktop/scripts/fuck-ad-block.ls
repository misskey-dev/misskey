# FUCK AD BLOCK
#================================

require 'fuck-adblock'
dialog = require './dialog.ls'

module.exports = ~>
	if fuck-ad-block == undefined
		ad-block-detected!
	else
		fuck-ad-block.on-detected ad-block-detected

function ad-block-detected
	dialog do
		'<i class="fa fa-exclamation-triangle"></i>広告ブロッカーを無効にしてください'
		'<strong>Misskeyは広告を掲載していません</strong>が、広告をブロックする機能が有効だと一部の機能が利用できなかったり、不具合が発生する場合があります。'
		[
			text: \OK
		]
