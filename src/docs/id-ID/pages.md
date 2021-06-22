# Pages

## Variabel
Kamu bisa buat laman dinamis menggunakan variabel. Dengan menulis <b>{ nama-variabel }</b> di teksmu, nilai variabel tersebut bisa disematkan. Contohnya, jika nilai suatu variabel thing di dalam teks <b>Hello {thing} world!</b> adalah <b>ai</b>, maka teksnya akan berubah menjadi <b>Hello ai world!</b>

Variabel dievaluasi dari atas ke bawah, makanya tidak mungkin merujuk variabel sebelum dideklarasikan.例えば上から <b>A、B、C</b> と3つの変数を定義したとき、<b>C</b>の中で<b>A</b>や<b>B</b>を参照することはできますが、<b>A</b>の中で<b>B</b>や<b>C</b>を参照することはできません。

ユーザーからの入力を受け取るには、ページに「ユーザー入力」ブロックを設置し、「変数名」に入力を格納したい変数名を設定します(変数は自動で作成されます)。その変数を使ってユーザー入力に応じた動作を行えます。

関数を使うと、値の算出処理を再利用可能な形にまとめることができます。関数を作るには、「関数」タイプの変数を作成します。関数にはスロット(引数)を設定することができ、スロットの値は関数内で変数として利用可能です。また、関数を引数に取る関数(高階関数と呼ばれます)も存在します。関数は予め定義しておくほかに、このような高階関数のスロットに即席でセットすることもできます。
