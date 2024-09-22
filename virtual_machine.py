from abc import ABC, abstractmethod
from typing import List, Any, Callable


class VMState:
    def __init__(self):
        self.stack: List[Any] = []
        self.pc: int = 0

class Instruction(ABC):
    @abstractmethod
    def execute(self, state: VMState) -> None:
        pass

class Push(Instruction):
    """Push is an instruction that pushes a value onto the top of the stack."""
    def __init__(self, value: Any):
        self.value = value

    def execute(self, state: VMState) -> None:
        state.stack.append(self.value)

class Pop(Instruction):
    """Pop is an instruction that removes the first value from the stack and returns it."""
    def execute(self, state: VMState) -> Any:
        return state.stack.pop()

class Add(Instruction):
    """Add is an instruction that pops the top two values from the stack, adds them together, and pushes the result back onto the stack."""
    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        Push(a + b).execute(state)

class Sub(Instruction):
    """Sub is an instruction that pops the top two values from the stack, subtracts the second one popped from the first one popped, and pushes the result back onto the stack."""
    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        Push(a - b).execute(state)

class StackVM:
    def __init__(self):
        self.state = VMState()
        self.instructions: List[Instruction] = []
        self.observers: List[Callable[[VMState], None]] = []

    def add_observer(self, observer: Callable[[VMState], None]) -> None:
        self.observers.append(observer)

    def notify_observers(self) -> None:
        for observer in self.observers:
            observer(self.state)
    
    def inspect(self) -> VMState:
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
