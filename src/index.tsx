import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import TimerButton from "./components/TimerButton";

const App = () => (
  <div className="p-4">
    <h1 className="text-2xl mb-4">Timer Test</h1>
    <TimerButton
      label="Test Button"
      onDelete={() => alert("Deleted")}
      index={0}
      isDeleted={false}
      groupName="FOI"
    />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
