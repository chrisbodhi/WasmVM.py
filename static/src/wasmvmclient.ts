// import { loadPyodide, PyodideInterface } from "pyodide";

// eslint-disable-next-line
export type PyProxy = any;

export type NumTypes = "i32" | "i64" | "f32" | "f64";
export type Command =
  | "add"
  | "and"
  | "div"
  | "drop"
  | "eq"
  | "eqz"
  | "ge"
  | "gt"
  | "le"
  | "lt"
  | "mul"
  | "or"
  | "pop"
  | "push"
  | "sub"
  | "xor";

export const commands: Command[] = [
  "add",
  "and",
  "div",
  "drop",
  "eq",
  "eqz",
  "ge",
  "gt",
  "le",
  "lt",
  "mul",
  "or",
  "pop",
  "push",
  "sub",
  "xor",
];

export interface Instruction {
  instruction: Command;
  type: NumTypes;
  acceptsValue?: boolean;
}

export interface VMConfig {
  pages: number;
  maxPages: number;
}

export class WasmVMClient {
  // @ts-expect-error -- we don't have type defs
  private pyodide: PyodideInterface | null = null;
  private vm: PyProxy | null = null;
  private readonly WHEEL_URL: string;

  constructor(wheelUrl: string) {
    this.WHEEL_URL = wheelUrl;
  }

  async initialize(isDebug = false): Promise<void> {
    try {
      // @ts-expect-error -- we don't have type defs
      this.pyodide = await loadPyodide();
      console.log("Pyodide loaded successfully");

      console.log("Loading micropip package...");
      await this.pyodide.loadPackage("micropip");
      console.log("micropip package loaded");

      console.log("Importing micropip...");
      const micropip = this.pyodide.pyimport("micropip");
      console.log("micropip imported");

      console.log("Installing WasmVM wheel...");
      console.log("Wheel URL:", this.WHEEL_URL);
      await micropip.install(this.WHEEL_URL);

      if (isDebug) {
        this.pyodide.setDebug(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Detailed helper error:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          pyodideState: this.pyodide ? "initialized" : "null",
        });
      } else {
        console.error("Error:", error);
      }
      throw error;
    }
  }

  async createVM(config: VMConfig): Promise<void> {
    if (!this.pyodide) throw new Error("Pyodide not initialized");

    this.pyodide.runPython(`
      from wasmvm import StackVM
      vm = StackVM(${config.pages}, ${config.maxPages})
    `);
    this.vm = this.pyodide.globals.get("vm");
  }

  async executeInstructions(instructions: Instruction[]): Promise<string[]> {
    if (!this.pyodide || !this.vm) throw new Error("VM not initialized");

    const mapping = this.createInstructionMapping();

    const pyInstructions = instructions.map(({ instruction, type, value }) => {
      const pyInstruction = mapping[instruction];
      return value !== undefined
        ? pyInstruction(value, mapping[type])
        : pyInstruction(mapping[type]);
    });

    this.vm.instructions = this.pyodide.toPy(pyInstructions);
    this.vm.run();
    return this.inspectStack();
  }

  inspectStack(): string[] {
    if (!this.vm) throw new Error("VM not initialized");
    return this.vm.inspect();
  }

  private createInstructionMapping(): Record<Command | NumTypes, PyProxy> {
    if (!this.pyodide) throw new Error("Pyodide not initialized");

    return {
      add: this.pyodide.pyimport("wasmvm.Add"),
      and: this.pyodide.pyimport("wasmvm.AND"),
      div: this.pyodide.pyimport("wasmvm.Div"),
      drop: this.pyodide.pyimport("wasmvm.Drop"),
      eq: this.pyodide.pyimport("wasmvm.Eq"),
      eqz: this.pyodide.pyimport("wasmvm.Eqz"),
      f32: this.pyodide.pyimport("wasmvm.f32"),
      f64: this.pyodide.pyimport("wasmvm.f64"),
      ge: this.pyodide.pyimport("wasmvm.Ge"),
      gt: this.pyodide.pyimport("wasmvm.Gt"),
      i32: this.pyodide.pyimport("wasmvm.i32"),
      i64: this.pyodide.pyimport("wasmvm.i64"),
      le: this.pyodide.pyimport("wasmvm.Le"),
      lt: this.pyodide.pyimport("wasmvm.Lt"),
      mul: this.pyodide.pyimport("wasmvm.Mul"),
      or: this.pyodide.pyimport("wasmvm.OR"),
      pop: this.pyodide.pyimport("wasmvm.Pop"),
      push: this.pyodide.pyimport("wasmvm.Push"),
      sub: this.pyodide.pyimport("wasmvm.Sub"),
      xor: this.pyodide.pyimport("wasmvm.XOR"),
    };
  }
}
