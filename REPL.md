## REPL

If you're working with an editor that supports Jupyter notebooks, you can use the following code snippets to interact with the virtual machine.

For Zed, setting up looks like this: https://zed.dev/docs/repl#python

```python
# %%
import sys
sys.path.append('./src')

from wasmvm import StackVM, Add, Eqz, Sub, Push

vm = StackVM()
vm.instructions = [Push(3, "i32"), Push(4, "i32"), Add("i32"), Push(7, "i32"), Sub("i32"), Eqz("i32")]
vm.run()
vm.inspect()
# [1]
```
