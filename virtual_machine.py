from abc import ABC, abstractmethod
from typing import Any, Callable, List, Union
import struct

WasmValue = Union[int, float]

def i32(value: int) -> int:
    """
    Truncate numbers greater than 32 bits down to 32 bits
    """
    return value & 0xFFFFFFFF

def i64(value: int) -> int:
    """
    Truncate numbers greater than 64 bits down to 64 bits
    """
    return value & 0xFFFFFFFFFFFFFFFF

def f32(value: float) -> float:
    """
    Ensures that the float is a 32-bit float
    N.B. Python's float type is 64-bit
    """
    return struct.unpack('f', struct.pack('f', value))[0]

def f64(value: float) -> float:
    """
    Identity function; Python's float is already 64-bit
    """
    return value

num_fns = {
    "i32": i32,
    "i64": i64,
    "f32": f32,
    "f64": f64,
}

supported_value_types = list(num_fns.keys())

def make_page() -> list[bytes]:
    ONE_BYTE = b'\x00'
    KiB = 1_024
    return [ONE_BYTE] * KiB * 10

class VMState:
    def __init__(self, pages: int, max_pages: int):
        self.stack: List[WasmValue] = []
        self.pc: int = 0
        self.memory: list[list[bytes]] = [make_page() for _ in range(pages)]
        self.max_pages = max_pages

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

class Add(Instruction):
    """
    Add is an instruction that pops the top two values from the stack, adds them together, and pushes the result back onto the stack.
    """
    def __init__(self, value_type: str):
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
    def __init__(self, value_type: str):
        if value_type not in supported_value_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        Push(self.fn(a - b)).execute(state)

class Mult(Instruction):
    """
    Mult multiplies the top two values on the stack, and pushes the product back onto the stack.
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

class StackVM:
    def __init__(self, pages: int = 0, max_pages: int = 0):
        self.state = VMState(pages, max_pages)
        self.instructions: List[Instruction] = []
        self.observers: List[Callable[[VMState], None]] = []

    def add_observer(self, observer: Callable[[VMState], None]) -> None:
        self.observers.append(observer)

    def notify_observers(self) -> None:
        for observer in self.observers:
            observer(self.state)

    def inspect(self) -> List:
        return self.state.stack

    def execute(self, instruction: Instruction) -> None:
        instruction.execute(self.state)
        self.notify_observers()

    def run(self) -> None:
        while self.state.pc < len(self.instructions):
            instruction = self.instructions[self.state.pc]
            self.execute(instruction)
            self.state.pc += 1

# An observer to get you started
def print_state(state: VMState) -> None:
    print(f"Stack: {state.stack}, PC: {state.pc}")
