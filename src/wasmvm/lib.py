from abc import ABC, abstractmethod
from typing import Any

from wasmvm.shared import VMState, WasmValue, make_page
from wasmvm.functions import num_fns

supported_value_types = list(num_fns.keys())

class Instruction(ABC):
    @abstractmethod
    def execute(self, state: VMState) -> Any:
        pass

### Stack operations -- begin ###
class Push(Instruction):
    """
    Push is an instruction that pushes a value onto the top of the stack.
    """
    def __init__(self, value: WasmValue):
        self.value = value

    def execute(self, state: VMState) -> None:
        state.stack.append(self.value)

class Pop(Instruction):
    """
    Pop is an instruction that removes the first value from the stack and returns it.
    """
    def execute(self, state: VMState) -> WasmValue:
        return state.stack.pop()

class Grow(Instruction):
    """
    Grow is an instruction to increase the size of memory by a page, up until
    reaching the maximum specified when initializing the VM.
    """
    def execute(self, state: VMState) -> None:
        if len(state.memory) < state.max_pages:
            state.memory.append(make_page())

### Stack operations -- end ###

### Instructions -- start ###

class Add(Instruction):
    """
    Add is an instruction that pops the top two values from the stack, adds them together, and pushes the result back onto the stack.
    """
    def __init__(self, value_type: str) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        Push(self.fn(a + b)).execute(state)

class Sub(Instruction):
    """
    Sub is an instruction that pops the top two values from the stack, subtracts the second one popped from the first one popped, and pushes the result back onto the stack.
    """
    def __init__(self, value_type: str) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        Push(self.fn(a - b)).execute(state)

class Mul(Instruction):
    """
    Mul multiplies the top two values on the stack, and pushes the product back onto the stack.
    """
    def __init__(self, value_type) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(a * b)).execute(state)

class Div(Instruction):
    """
    Div divides the value at the top of stack by the value immediately following it, and pushes the quotient back onto the stack.
    """
    def __init__(self, value_type) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        dividend = Pop().execute(state)
        divisor = Pop().execute(state)
        Push(self.fn(dividend / divisor)).execute(state)

class Eq(Instruction):
    """
    Eq compares the top two values on the stack, and pushes a 1 to the stack if they are equal,
    and a 0 if they are not.
    """
    def __init__(self, value_type) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(1 if a == b else 0)).execute(state)

class Eqz(Instruction):
    """
    Eqz compares the top value from the stack to 0, and if it is equal, then a 1 is pushed
    to the stack; if it is not, then a 0 is pushed to the stack. This operation is only
    for integers, not floats.
    """
    def __init__(self, value_type) -> None:
        if value_type not in ["i32", "i64"]:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        top = Pop().execute(state)
        Push(self.fn(1 if top == 0 else 0)).execute(state)

class Lt(Instruction):
    """
    Lt compares the top two values of the stack. If the top value is less than
    the value immediately following it, a 1 is pushed onto the stack. Otherwise,
    a 0 is pushed onto the stack.
    """
    def __init__(self, value_type) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(b)).execute(state)
        Push(self.fn(a)).execute(state)
        Push(self.fn(1 if a < b else 0)).execute(state)

class Gt(Instruction):
    """
    Gt compares the top two values of the stack. If the top value is greater than the value immediately following it, a 1 is pushed onto the stack. Otherwise, a 0 is pushed onto the stack.
    """
    def __init__(self, value_type) -> None:
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> Any:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(b)).execute(state)
        Push(self.fn(a)).execute(state)
        Push(self.fn(1 if a > b else 0)).execute(state)

### Instructions -- end ###
