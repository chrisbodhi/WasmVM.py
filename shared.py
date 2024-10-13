WasmValue = int | float

class VMState:
    def __init__(self, pages: int, max_pages: int):
        self.stack: list[WasmValue] = []
        self.pc: int = 0
        self.memory: list[list[bytes]] = [make_page() for _ in range(pages)]
        self.max_pages = max_pages

def make_page() -> list[bytes]:
    ONE_BYTE = b'\x00'
    KiB = 1_024
    return [ONE_BYTE] * KiB * 10
