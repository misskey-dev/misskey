# Pages

## Variables
Vous pouvez créer des pages dynamiques en utilisant des variables.Vous pouvez incorporer la valeur d'une variable en insérant le <b>{ variablename }</b> dans votre texte.Par exemple, si la valeur de la variable "thing" dans le texte <b>Hello { thing } world!</b> est <b>ai</b>, votre trexte devient alors : <b>Hello ai world!</b>.

Les variables sont évaluées du haut vers le bas, il n'est donc pas possible de référencer une variable située plus bas que celle en cours.Par exemple, si vous définissez, dans l'ordre, 3 variables telles que <b>A、B、C</b>, vous pourrez référencer en <b>C</b> aussi bien <b>A</b> que <b>B</b> ; par contre, vous ne pourrez référencer en <b>A</b> ni <b>B</b> ni <b>C</b>.

ユーザーからの入力を受け取るには、ページに「ユーザー入力」ブロックを設置し、「変数名」に入力を格納したい変数名を設定します(変数は自動で作成されます)。その変数を使ってユーザー入力に応じた動作を行えます。

関数を使うと、値の算出処理を再利用可能な形にまとめることができます。関数を作るには、「関数」タイプの変数を作成します。関数にはスロット(引数)を設定することができ、スロットの値は関数内で変数として利用可能です。また、関数を引数に取る関数(高階関数と呼ばれます)も存在します。関数は予め定義しておくほかに、このような高階関数のスロットに即席でセットすることもできます。
