## REPL

If you're working with an editor that supports Jupyter notebooks, you can use the following code snippets to interact with the virtual machine.

For Zed, setting up looks like this: https://zed.dev/docs/repl#python

```python
# %%
import sys
sys.path.append('./src')

from wasmvm import StackVM, Add, AND, Eqz, Sub, OR, Push, XOR

vm = StackVM()
vm.instructions = [Push(3, "i32"), Push(4, "i32"), Add("i32"), Push(7, "i32"), Sub("i32"), Eqz("i32")]
vm.run()
print("Expected first: [1]")
vm.inspect()
# [1]
vm.instructions = [Push(33, "i32"), AND("i32")]
vm.run()
print("Expected second: [1]")
vm.inspect()
```
