# Pages

## Variables
You can create dynamic pages using variables.By writing <b>{ variable-name }</b> in your text, the value of that variable can be embedded.For example, if the value of the variable thing is <b>ai</b> in the text <b>Hello { thing } world!</b>, then the text will turn into <b>Hello ai world!</b>.

Variables are evaluated from top to bottom, so referencing variables not yet declared is not possible.For example, when declaring the three variables <b>A, B, C</b> in the given order, referencing <b>A</b> or <b>B</b> from within <b>C</b> is possible, but referencing <b>B</b> or <b>C</b> from within <b>A</b> is not.

To receive user input on your page, include a "User input" block and set it to store the user's input in a variable name (the variable will automatically be created).You can then activate different actions depending on the user input stored in that variable.

Using functions allows you to create a reusable way of calculating values.To use functions, create a variable of the type "function".Functions can use slots (arguments), which are then available as variables within the function.また、関数を引数に取る関数(高階関数と呼ばれます)も存在します。関数は予め定義しておくほかに、このような高階関数のスロットに即席でセットすることもできます。
