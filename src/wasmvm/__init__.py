from .virtual_machine import StackVM
from .functions import f32, f64, i32, i64
from .lib import Add, Div, Eq, Eqz, Gt, Instruction, Lt, Mul, Pop, Push, Sub

__all__ = [
    'StackVM',
    'f32', 'f64', 'i32', 'i64',
    'Add', 'Div', 'Eq', 'Eqz', 'Gt', 'Instruction', 'Lt', 'Mul', 'Pop', 'Push', 'Sub'
]
