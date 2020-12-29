# Pages

## Variables
You can create dynamic pages using variables.By writing <b>{ variable-name }</b> in your text, the value of that variable can be embedded.For example, if the value of the variable thing is <b>ai</b> in the text <b>Hello { thing } world!</b> the text will turn into <b>Hello ai world!</b>.

Variables are evaluated from top to bottom, so referencing variables not yet declared is not possible.例えば上から <b>A、B、C</b> と3つの変数を定義したとき、<b>C</b>の中で<b>A</b>や<b>B</b>を参照することはできますが、<b>A</b>の中で<b>B</b>や<b>C</b>を参照することはできません。

ユーザーからの入力を受け取るには、ページに「ユーザー入力」ブロックを設置し、「変数名」に入力を格納したい変数名を設定します(変数は自動で作成されます)。その変数を使ってユーザー入力に応じた動作を行えます。

関数を使うと、値の算出処理を再利用可能な形にまとめることができます。関数を作るには、「関数」タイプの変数を作成します。関数にはスロット(引数)を設定することができ、スロットの値は関数内で変数として利用可能です。また、関数を引数に取る関数(高階関数と呼ばれます)も存在します。関数は予め定義しておくほかに、このような高階関数のスロットに即席でセットすることもできます。
