import { useState } from "react";

import "./App.css";
import { Box } from "./Box";

// eslint-disable-next-line
type PyProxy = any;

interface VM {
  pages: number;
  max_pages: number;
  inspect: () => string[];
  instructions: Array<unknown>;
  run: () => void;
}

type NumTypes = "i32" | "i64" | "f32" | "f64";

const commands = [
  "add",
  "div",
  "eq",
  "eqz",
  "gt",
  "lt",
  "mul",
  "pop",
  "push",
  "sub",
] as const;

interface Instruction {
  instruction: (typeof commands)[number];
  types: NumTypes[];
  acceptsValue: boolean;
}

const WHEEL_URL =
  "https://files.pythonhosted.org/packages/91/b2/d798c9f63876e2551b62afdd5cb39b9ddfe15b16ab29c3b3503a206e628e/WasmVM-0.1.0-py3-none-any.whl";

// @ts-expect-error -- untyped until we install from package.json
let pyodide;

(async function () {
  // @ts-expect-error -- loaded from script tag in index.html
  pyodide = await loadPyodide();
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(WHEEL_URL);

  if (import.meta.env.DEV) {
    pyodide.setDebug(true);
    console.log("THIS. IS. DEV.");
  } else {
    console.log("THIS. IS. PROD.");
  }
})();

const InstructionButton = ({
  instruction,
  types,
  acceptsValue,
  onClick,
}: Pick<Instruction, "instruction" | "types"> & {
  acceptsValue: boolean;
  onClick: (
    instruction: (typeof commands)[number],
    type: NumTypes,
    value?: number,
  ) => void;
}) => {
  const [value, setValue] = useState("");
  const [type, setType] = useState(types[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClick(instruction, type, value ? Number(value) : undefined);
        // Reset the state
        setValue("");
        setType(types[0]);
      }}
      style={{
        backgroundColor: acceptsValue ? "lightgreen" : "lightcoral",
      }}
    >
      {instruction}
      <select
        onChange={(e) => setType(e.target.value as NumTypes)}
        value={type}
      >
        {types.map((t, index) => (
          <option key={index + t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {acceptsValue ? (
        <>
          <input
            type="range"
            onChange={(e) => setValue(e.target.value)}
            value={value}
            min={-100}
          />
          {value}
        </>
      ) : null}
      <button>Move to stack</button>
    </form>
  );
};

function App() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [toSend, setToSend] = useState<
    {
      instruction: (typeof commands)[number];
      type: NumTypes;
      value?: number;
    }[]
  >([]);
  const [pages, setPages] = useState(0);
  const [maxPages, setMaxPages] = useState(1);
  const [stack, setStack] = useState<string[]>([]);
  const [vm, setVm] = useState<VM>();

  function getVM() {
    pyodide.runPython(`
        from wasmvm import StackVM
        vm = StackVM(${pages}, ${maxPages})
        print(f"Got a VM! It has ${pages} pages and can have up to ${maxPages} pages.")
    `);
    const vm = pyodide.globals.get("vm");
    setVm(vm);
  }

  const fetchInstructions = async () => {
    const rawInstructions: Instruction[] = commands.map((cmd) => ({
      instruction: cmd,
      types: cmd === "eqz" ? ["i32", "i64"] : ["i32", "i64", "f32", "f64"],
      acceptsValue: cmd === "push",
    }));
    setInstructions(rawInstructions);
  };

  const addInstruction = (
    instruction: (typeof commands)[number],
    type: NumTypes,
    value: number | undefined,
  ) => {
    setToSend([...toSend, { instruction, type, value }]);
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = Number(e.target.value);
    const newSend = toSend.map((s, i) => (i === index ? { ...s, value } : s));
    setToSend(newSend);
  };

  const handleRemove = (index: number) =>
    setToSend(toSend.filter((_, i) => i !== index));

  const sendInstructions = async () => {
    if (!vm) {
      console.error("No VM; get one");
      return;
    }

    // Add the instructions to the VM from toSend
    const mapping: Record<(typeof commands)[number] | NumTypes, PyProxy> = {
      add: pyodide.pyimport("wasmvm.Add"),
      div: pyodide.pyimport("wasmvm.Div"),
      eq: pyodide.pyimport("wasmvm.Eq"),
      eqz: pyodide.pyimport("wasmvm.Eqz"),
      f32: pyodide.pyimport("wasmvm.f32"),
      f64: pyodide.pyimport("wasmvm.f64"),
      gt: pyodide.pyimport("wasmvm.Gt"),
      i32: pyodide.pyimport("wasmvm.i32"),
      i64: pyodide.pyimport("wasmvm.i64"),
      lt: pyodide.pyimport("wasmvm.Lt"),
      mul: pyodide.pyimport("wasmvm.Mul"),
      pop: pyodide.pyimport("wasmvm.Pop"),
      push: pyodide.pyimport("wasmvm.Push"),
      sub: pyodide.pyimport("wasmvm.Sub"),
    };

    const ins = toSend.map((s) => {
      const instruction = mapping[s.instruction];
      return s.value !== undefined
        ? instruction(mapping[s.type](s.value))
        : instruction(mapping[s.type]);
    });

    vm.instructions = pyodide.toPy(ins);
    vm.run();

    setToSend([]);
    setStack(vm.inspect());

    // const jsonSend = await resSend.json();
    // console.log("stack after send", jsonSend);
    // setToSend([]);

    // const resRun = await fetch(`http://localhost:8000/run/${vmId}`, {
    //   method: "POST",
    // });
    // const jsonRun = await resRun.json();
    // console.log("stack after run", jsonRun);
    // setStack(jsonRun);
  };

  return (
    <>
      <header>
        <h1>WasmVM.py</h1>
      </header>
      <main>
        <div>
          {instructions.length === 0 && (
            <button onClick={fetchInstructions}>Get instructions</button>
          )}
          <div>
            VM contents: {vm ? JSON.stringify(vm.inspect()) : "Get a new VM"}
          </div>
          <div>
            VM instructions: {vm ? JSON.stringify(vm.instructions) : "None"}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label>
              Pages
              <input
                type="number"
                onChange={(event) => setPages(Number(event.target.value))}
              />
            </label>
            <label>
              Max pages
              <input
                type="number"
                onChange={(event) => setMaxPages(Number(event.target.value))}
              />
            </label>
            <button onClick={() => getVM()}>Get a new VM</button>
          </form>
        </div>
        <div style={{ display: "flex" }}>
          <div className="card">
            <ul>
              {instructions.map(
                ({ instruction, types, acceptsValue }, index) => (
                  <li
                    key={index + instruction}
                    style={{ listStyle: "none", margin: "0.5rem" }}
                  >
                    <InstructionButton
                      instruction={instruction}
                      types={types}
                      acceptsValue={acceptsValue}
                      onClick={addInstruction}
                    />
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="card">
            <h2>Instructions to send</h2>
            <ul style={{ display: "flex", flexDirection: "column-reverse" }}>
              {toSend.map(({ instruction, type, value }, index) => (
                <li key={index + instruction}>
                  <Box
                    instruction={instruction}
                    type={type}
                    value={value}
                    index={index}
                    handleChange={(e) => handleValueChange(e, index)}
                    handleRemove={handleRemove}
                  />
                  <div className="rounded">
                    <span>
                      {instruction} | {type}
                    </span>
                    {value !== undefined ? <span>{value}</span> : null}
                    <button onClick={() => handleRemove(index)}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <button onClick={sendInstructions} disabled={!toSend.length}>
              <big>Send instructions</big>
            </button>
          </div>
          <div className="card">
            <h2>Stack</h2>
            <ul style={{ display: "flex", flexDirection: "column-reverse" }}>
              {stack.map((value, index) => (
                <li key={index + value}>{value}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <footer>
        <p>
          {" "}
          built in pgh &int; &copy; 2024 by{" "}
          <a href="https://github.com/chrisbodhi" target="_blank">
            @chrisbodhi
          </a>{" "}
          &int;{" "}
          <a href="https://github.com/chrisbodhi/WasmVM.py" target="_blank">
            pull requests welcome
          </a>{" "}
        </p>
      </footer>
    </>
  );
}

export default App;
