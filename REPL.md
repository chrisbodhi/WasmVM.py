## REPL

If you're working with an editor that supports Jupyter notebooks, you can use the following code snippets to interact with the virtual machine.

```python
# %%
from virtual_machine import StackVM
from lib import Add, Sub, Push
from functions import i32

vm = StackVM()
vm.instructions = [Push(i32(3))]
vm.run()
vm.inspect()
# [3]
```
