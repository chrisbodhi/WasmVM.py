from typing import Union

from functions import make_page

WasmValue = Union[int, float]

class VMState:
    def __init__(self, pages: int, max_pages: int):
        self.stack: list[WasmValue] = []
        self.pc: int = 0
        self.memory: list[list[bytes]] = [make_page() for _ in range(pages)]
        self.max_pages = max_pages
