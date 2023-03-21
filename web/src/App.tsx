import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-center font-bold text-3xl">Envoi API</h1>
      <div></div>
    </div>
  );
}

export default App;
