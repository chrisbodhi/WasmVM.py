import { useEffect, useState } from "react";

import "./App.css";
import { Box } from "./Box";

type NumTypes = "i32" | "i64" | "f32" | "f64";

interface Instruction {
  instruction: string;
  types: NumTypes[];
  accepts_value: boolean;
}

const InstructionButton = ({
  instruction,
  types,
  acceptsValue,
  onClick,
}: Pick<Instruction, "instruction" | "types"> & {
  acceptsValue: boolean;
  onClick: (instruction: string, type: NumTypes, value?: number) => void;
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
        <input
          type="number"
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      ) : null}
      <button>Move to stack</button>
    </form>
  );
};

function App() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [toSend, setToSend] = useState<
    {
      instruction: string;
      type: NumTypes;
      value?: number;
    }[]
  >([]);
  const [pages, setPages] = useState(0);
  const [maxPages, setMaxPages] = useState(0);
  const [stack, setStack] = useState([]);
  const [vmId, setVmId] = useState("");

  useEffect(() => {
    getOrSetVM();
  });

  function getOrSetVM() {
    // read from localStorage to get the vmId
    const vmId = localStorage.getItem("vmId");
    if (vmId) {
      setVmId(vmId);
    } else {
      getVM();
    }
  }

  function getVM() {
    fetch("http://localhost:8000/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pages,
        max_pages: maxPages,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        const [, vmId] = json;
        setVmId(vmId);
        localStorage.setItem("vmId", vmId);
        setStack([]);
      });
  }

  const fetchInstructions = async () => {
    const res = await fetch("http://localhost:8000/instructions");
    const json = await res.json();
    setInstructions(json.instructions);
  };

  const addInstruction = (
    instruction: string,
    type: NumTypes,
    value: number | undefined,
  ) => {
    setToSend([...toSend, { instruction, type, value }]);
  };

  const handleRemove = (index: number) =>
    setToSend(toSend.filter((_, i) => i !== index));

  const sendInstructions = async () => {
    const resSend = await fetch(`http://localhost:8000/instructions/${vmId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        toSend.map(({ instruction, type, value }) => ({
          name: instruction,
          type,
          value,
        })),
      ),
    });
    const jsonSend = await resSend.json();
    console.log("stack after send", jsonSend);
    setToSend([]);

    const resRun = await fetch(`http://localhost:8000/run/${vmId}`, {
      method: "POST",
    });
    const jsonRun = await resRun.json();
    console.log("stack after run", jsonRun);
    setStack(jsonRun);
  };

  return (
    <>
      <header>
        <h1>wasmvm.py</h1>
      </header>
      <main>
        <div>
          {instructions.length === 0 && (
            <button onClick={fetchInstructions}>Get instructions</button>
          )}
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
                ({ instruction, types, accepts_value }, index) => (
                  <li
                    key={index + instruction}
                    style={{ listStyle: "none", margin: "0.5rem" }}
                  >
                    <InstructionButton
                      instruction={instruction}
                      types={types}
                      acceptsValue={accepts_value}
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
                    handleRemove={handleRemove}
                  />
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
