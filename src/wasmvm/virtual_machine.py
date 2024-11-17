from typing import Callable

from wasmvm.functions import i32
from wasmvm.lib import Instruction, Push, VMState

class StackVM:
    """
    This docstring shows up when we run the `help` command in the interpreter. Neat!
    """
    def __init__(self, pages: int = 0, max_pages: int = 1):
        self.state = VMState(pages, max(pages, max_pages))
        self.instructions: list[Instruction] = []
        self.observers: list[Callable[[VMState], None]] = []

    def add_observer(self, observer: Callable[[VMState], None]) -> None:
        self.observers.append(observer)

    def notify_observers(self) -> None:
        for observer in self.observers:
            observer(self.state)

    def inspect(self) -> list:
        return self.state.stack

    def execute(self, instruction: Instruction) -> None:
        instruction.execute(self.state)
        self.notify_observers()

    def run(self) -> None:
        while self.state.pc < len(self.instructions):
            instruction = self.instructions[self.state.pc]
            self.execute(instruction)
            self.state.pc += 1
        self.state.pc = 0
