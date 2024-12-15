from abc import ABC, abstractmethod
from typing import Any

from wasmvm.shared import Val_Type, VMState, Wasm_Value, make_page
from wasmvm.functions import num_fns
from typing import cast, Callable


supported_types =  ["i32", "i64", "f32", "f64"]


class Instruction(ABC):
    @abstractmethod
    def execute(self, state: VMState) -> Any:
        pass


# Stack operations -- begin
class Push(Instruction):
    """
    Push is an instruction that pushes a value onto the top of the stack.
    """

    def __init__(self, value: Wasm_Value, value_type: Val_Type):
        self.value = value
        self.value_type: Val_Type = value_type

    def execute(self, state: VMState) -> None:
        type_fn = num_fns[self.value_type]
        if isinstance(self.value, int):
            state.stack.append(type_fn(self.value))
        elif isinstance(self.value, float):
            float_fn = cast(Callable[[float], float], type_fn)
            state.stack.append(float_fn(self.value))


class Pop(Instruction):
    """
    Pop is an instruction that removes the first value
    from the stack and returns it.
    """

    def execute(self, state: VMState) -> Wasm_Value:
        return state.stack.pop()


class Grow(Instruction):
    """
    Grow is an instruction to increase the size of memory by a page, up until
    reaching the maximum specified when initializing the VM.
    """

    def execute(self, state: VMState) -> None:
        if len(state.memory) < state.max_pages:
            state.memory.append(make_page())

# Stack operations -- end

# Instructions -- start


class Add(Instruction):
    """
    Add is an instruction that pops the top two values from the
    stack, adds them together, and pushes the result back onto
    the stack.
    """

    def __init__(self, value_type: Val_Type) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type: Val_Type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        # TODO: determine how to pass in the expected type here,
        # now that the API has changed.
        # TODO: explore using cast, like in Push?
        Push(self.fn(a + b), self.value_type).execute(state)


class Sub(Instruction):
    """
    Sub is an instruction that pops the top two values from the
    stack, subtracts the second one popped from the first one
    popped, and pushes the result back onto the stack.
    """

    def __init__(self, value_type: str) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        b = Pop().execute(state)
        a = Pop().execute(state)
        Push(self.fn(a - b), self.value_type).execute(state)


class Mul(Instruction):
    """
    Mul multiplies the top two values on the stack, and pushes
    the product back onto the stack.
    """

    def __init__(self, value_type) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(a * b), self.value_type).execute(state)


class Div(Instruction):
    """
    Div divides the value at the top of stack by the value
    immediately following it, and pushes the quotient back
    onto the stack.
    """

    def __init__(self, value_type) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        dividend = Pop().execute(state)
        divisor = Pop().execute(state)
        Push(self.fn(dividend / divisor), self.value_type).execute(state)


class Eq(Instruction):
    """
    Eq compares the top two values on the stack, and pushes a 1
    to the stack if they are equal, and a 0 if they are not.
    """

    def __init__(self, value_type) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(1 if a == b else 0), self.value_type).execute(state)


class Eqz(Instruction):
    """
    Eqz compares the top value from the stack to 0, and if it
    is equal, then a 1 is pushed to the stack; if it is not,
    then a 0 is pushed to the stack. This operation is only
    for integers, not floats.
    """

    def __init__(self, value_type) -> None:
        if value_type not in ["i32", "i64"]:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        top = Pop().execute(state)
        Push(self.fn(1 if top == 0 else 0), self.value_type).execute(state)


class Lt(Instruction):
    """
    Lt compares the top two values of the stack. If the top
    value is less than the value immediately following it, a 1
    is pushed onto the stack. Otherwise, a 0 is pushed onto the
    stack.
    """

    def __init__(self, value_type) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> None:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(b), self.value_type).execute(state)
        Push(self.fn(a), self.value_type).execute(state)
        Push(self.fn(1 if a < b else 0), self.value_type).execute(state)


class Gt(Instruction):
    """
    Gt compares the top two values of the stack. If the top
    value is greater than the value immediately following it,
    a 1 is pushed onto the stack. Otherwise, a 0 is pushed onto
    the stack.
    """

    def __init__(self, value_type) -> None:
        if value_type not in supported_types:
            raise ValueError(f"Unsupported value type: {value_type}")
        self.value_type = value_type
        self.fn = num_fns[value_type]

    def execute(self, state: VMState) -> Any:
        a = Pop().execute(state)
        b = Pop().execute(state)
        Push(self.fn(b), self.value_type).execute(state)
        Push(self.fn(a), self.value_type).execute(state)
        Push(self.fn(1 if a > b else 0), self.value_type).execute(state)

# Instructions -- end
