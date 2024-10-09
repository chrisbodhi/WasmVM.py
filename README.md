# WasmVM.py
## A stack-based virtual machine for learning WebAssembly

This is a simple stack-based virtual machine that can execute a small set of
instructions. It is intended to be the starting point for learning more deeply
how WebAssembly works. Right now, like WebAssembly, it only supports 32- and
64-bit integers and floats for operations.

### Using

#### Basic usage

1. Open the Python REPL by running `python3` in your terminal.
1. Import the `StackVM` class and instructions.
    ```python
    from virtual_machine import StackVM
    from lib import Add, Sub, Push
    from functions import i32
    ```
1. Create an instance of the `StackVM` class.
    ```python
    vm = StackVM()
    # Optionally, you can specify the number of pages of memory
    # you want your VM to start with, and the maximum number it
    # may have: StackVM(1, 10)
    ```
1. Add instructions to your virtual machine.
    ```python
    vm.instructions = [Push(i32(2)), Push(i32(3)), Add("i32")]
    ```
1. Execute the instructions.
    ```python
    vm.run()
    ```
1. Inspect the stack after your instructions have been executed:
    ```python
    vm.inspect()
    # [5]
    ```

#### Hooking in observers

Since this is a learning tool, it can be useful to see what
your machine is doing while it's operating. Since this is
intended to be an extensible tool, you can add different
types of observers suited to your execution environment.

For example, you can add a simple observer that prints the
stack at each step by running (this one is included in the
`virtual_machine` module):

```python
from virtual_machine import StackVM
from lib import Add, Sub, Push
from shared import VMState

def print_state(state: VMState) -> None:
    print(f"Stack: {state.stack} || Program Counter: {state.pc}")

vm = StackVM()
vm.add_observer(print_state)
```

Then, when your virtual machine runs, you'll see the stack
printed after each instruction has been executed.

### Wait, what's a stack-based virtual machine?

In short, a stack-based virtual machine is a computer that uses a stack to
store data and execute instructions ("stack" like pancakes). Operations are
performed by pushing values onto the stack and then popping them off to be
used as arguments to instructions. The program counter (PC) keeps track of
where the virtual machine is in the program, and the stack is used to store
intermediate values.

Stack-based virtual machines are found in the wild in many places, such as the
Java Virtual Machine (JVM), the .NET Common Language Runtime (CLR), and (of
course) the WebAssembly virtual machine that's in your browser (unless you're
using Lynx).

### Instruction set

- `Add`
- `Sub`
- `Mul`
- `Div`
- `Eq`
- `Eqz`
- `Lt` _coming soon_
- `Le` _coming soon_
- `Gt` _coming soon_
- `Ge` _coming soon_

### Resources

There are many resources available to learn more about WebAssembly and how it
works. Here's what I've been using:

- [WebAssembly: The Definitive Guide](https://www.oreilly.com/library/view/webassembly-the-definitive/9781492089834/) by Brian Sletten
- [WABT](https://github.com/WebAssembly/wabt), the WebAssembly Binary Toolkit
- [Claude](https://claude.ai) and [GitHub Copilot](https://github.com/features/copilot)
