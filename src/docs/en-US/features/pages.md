# Pages

## Variables
Use variables to create dynamic pages. Put <b>{ variable-name }</b> in your content to embed the value. For example, if a variable named "thing" has the value <b>ai</b>, the string <b>Hello { thing } world!</b> turns into <b>Hello ai world!</b>.

Variables are evaluated from top to bottom, so referencing variables before declaring is not possible. For example, when declaring the three variables <b>A, B, C</b> in this order, you can use <b>A</b> or <b>B</b> in <b>C</b>, but you cannot use <b>B</b> or <b>C</b> in <b>A</b>.

ユーザーからの入力を受け取るには、ページに「ユーザー入力」ブロックを設置し、「変数名」に入力を格納したい変数名を設定します(変数は自動で作成されます)。その変数を使ってユーザー入力に応じた動作を行えます。

関数を使うと、値の算出処理を再利用可能な形にまとめることができます。関数を作るには、「関数」タイプの変数を作成します。関数にはスロット(引数)を設定することができ、スロットの値は関数内で変数として利用可能です。また、関数を引数に取る関数(高階関数と呼ばれます)も存在します。関数は予め定義しておくほかに、このような高階関数のスロットに即席でセットすることもできます。
