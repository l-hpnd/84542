import React, { useEffect, useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import classNames from "classnames";

type TimerButtonProps = {
  groupId: string;
  buttonId: string;
  name: string;
  duration: number;
  isActive: boolean;
};

const TimerButton: React.FC<TimerButtonProps> = ({
  groupId,
  buttonId,
  name,
  duration,
  isActive,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (!isActive || isRunning) return;
    setTimeLeft(duration);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  const handleDisable = () => {
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    update(buttonRef, { isActive: false });
  };

  const buttonColor = !isActive
    ? "bg-gray-400"
    : isRunning
    ? "bg-red-500"
    : "bg-green-500";

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center text-xs m-1 w-20">
      <button
        onClick={handleStart}
        disabled={!isActive}
        className={classNames(
          "text-white font-bold py-1 px-2 rounded w-full h-8 text-[10px]",
          buttonColor
        )}
      >
        {name}
      </button>
      <div className="text-lg font-bold mt-1">{formatTime(timeLeft)}</div>
      <div className="flex gap-1 mt-1">
        <button
          onClick={handleReset}
          className="bg-blue-400 hover:bg-blue-500 text-white px-1 py-0.5 rounded text-[10px]"
        >
          Reset
        </button>
        {isActive ? (
          <button
            onClick={handleDisable}
            className="bg-gray-600 hover:bg-gray-700 text-white px-1 py-0.5 rounded text-[10px]"
          >
            X
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default TimerButton;
