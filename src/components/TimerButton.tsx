import React, { useEffect, useState } from "react";
import { ref, update, onValue } from "firebase/database";
import { db } from "../firebase"; // путь к твоему файлу firebase.ts
import classNames from "classnames";

interface TimerButtonProps {
  groupId: string;
  buttonId: string;
  name: string;
  duration: number;
  isActive: boolean;
}

const TimerButton: React.FC<TimerButtonProps> = ({
  groupId,
  buttonId,
  name,
  duration,
  isActive,
}) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);

  // Подписка на изменения startedAt и duration из Firebase
  useEffect(() => {
    const unsubscribe = onValue(buttonRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.startedAt && data.duration) {
        const elapsed = Math.floor((Date.now() - data.startedAt) / 1000);
        const remaining = data.duration - elapsed;
        if (remaining > 0) {
          setStartedAt(data.startedAt);
          setTimeLeft(remaining);
          setIsRunning(true);
        } else {
          setStartedAt(null);
          setTimeLeft(data.duration);
          setIsRunning(false);
        }
      } else {
        setStartedAt(null);
        setTimeLeft(duration);
        setIsRunning(false);
      }
    });

    return () => unsubscribe();
  }, [buttonId, groupId]);

  // Локальный таймер обратного отсчета
  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = duration - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
      setIsRunning(remaining > 0);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, duration]);

  const handleStart = () => {
    if (!isRunning) {
      update(buttonRef, {
        startedAt: Date.now(),
        duration,
        isActive: true,
      });
    }
  };

  const handleReset = () => {
    update(buttonRef, {
      startedAt: null,
      isActive: true,
    });
    setTimeLeft(duration);
    setIsRunning(false);
  };

  const handleDisable = () => {
    update(buttonRef, {
      isActive: false,
      startedAt: null,
    });
  };

  const buttonColor = !isActive
    ? "bg-gray-400"
    : isRunning
    ? "bg-red-500"
    : "bg-green-500";

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
      <div className="text-[10px]">{timeLeft}s</div>
      <div className="flex gap-1 mt-1">
        <button
          onClick={handleReset}
          className="bg-blue-400 hover:bg-blue-500 text-white px-1 py-0.5 rounded text-[10px]"
        >
          Reset
        </button>
        <button
          onClick={handleDisable}
          className="bg-gray-600 hover:bg-gray-700 text-white px-1 py-0.5 rounded text-[10px]"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default TimerButton;
