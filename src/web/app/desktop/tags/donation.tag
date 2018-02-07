<mk-donation>
	<button class="close" @click="close">閉じる x</button>
	<div class="message">
		<p>利用者の皆さま、</p>
		<p>
			今日は、日本の皆さまにお知らせがあります。
			Misskeyの援助をお願いいたします。
			私は独立性を守るため、一切の広告を掲載いたしません。
			平均で約¥1,500の寄付をいただき、運営しております。
			援助をしてくださる利用者はほんの少数です。
			お願いいたします。
			今日、利用者の皆さまが¥300ご援助くだされば、募金活動を一時間で終了することができます。
			コーヒー1杯ほどの金額です。
			Misskeyを活用しておられるのでしたら、広告を掲載せずにもう1年活動できるよう、どうか1分だけお時間をください。
			私は小さな非営利個人ですが、サーバー、プログラム、人件費など、世界でトップクラスのウェブサイト同等のコストがかかります。
			利用者は何億人といますが、他の大きなサイトに比べてほんの少額の費用で運営しているのです。
			人間の可能性、自由、そして機会。知識こそ、これらの基盤を成すものです。
			私は、誰もが無料かつ制限なく知識に触れられるべきだと信じています。
			募金活動を終了し、Misskeyの改善に戻れるようご援助ください。
			よろしくお願いいたします。
		</p>
	</div>
	<style>
		:scope
			display block
			color #fff
			background #03072C

			> .close
				position absolute
				top 16px
				right 16px
				z-index 1

			> .message
				padding 32px
				font-size 1.4em
				font-family serif

				> p
					display block
					margin 0 auto
					max-width 1200px

				> p:first-child
					margin-bottom 16px

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.close = e => {
			e.preventDefault();
			e.stopPropagation();

			this.I.client_settings.show_donation = false;
			this.I.update();
			this.api('i/update', {
				show_donation: false
			});

			this.$destroy();
		};
	</script>
</mk-donation>
