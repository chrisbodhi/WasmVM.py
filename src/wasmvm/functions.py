import struct
from typing import Callable, Dict, Literal, Union


def i32(value: int | float) -> int:
    """
    Truncate numbers greater than 32 bits down to 32 bits
    """
    return int(value) & 0xFFFFFFFF


def i64(value: int | float) -> int:
    """
    Truncate numbers greater than 64 bits down to 64 bits
    """
    return int(value) & 0xFFFFFFFFFFFFFFFF


def f32(value: float | int) -> float:
    """
    Ensures that the float is a 32-bit float
    N.B. Python's float type is 64-bit
    """
    return struct.unpack('f', struct.pack('f', value))[0]


def f64(value: float | int) -> float:
    """
    Identity function; Python's float is already 64-bit
    """
    return value


num_fns: Dict[Literal["i32", "i64", "f32", "f64"], Union[Callable[[int | float], int], Callable[[float | int], float]]] = {
    "i32": i32,
    "i64": i64,
    "f32": f32,
    "f64": f64,
}
