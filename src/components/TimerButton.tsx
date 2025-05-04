import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimerButtonProps {
  label: string;
  groupName: string;
  isDeleted: boolean;
  isNew: boolean;
  index: number;
  isEditMode: boolean;
  onDelete: () => void;
  onRestore: () => void;
  onLabelChange: (newLabel: string) => void;
  onRemove: () => void;
  duration: number;
}

const TimerButton: React.FC<TimerButtonProps> = ({
  label,
  isDeleted,
  isEditMode,
  isNew,
  onDelete,
  onRestore,
  onLabelChange,
  onRemove,
  duration,
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timer);
          setIsRunning(false);
          return null;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (isDeleted || isEditMode) return;
    setTimeLeft(duration);
    setIsRunning(true);
  };

  const handleReset = () => {
    setTimeLeft(null);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const backgroundColor = isDeleted
    ? "bg-gray-400"
    : isRunning
    ? "bg-red-500"
    : "bg-green-500";

  const containerWidth = "w-[77%]";

  return (
    <div className="flex flex-col items-left">
      {isEditMode ? (
        <>
          <Input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            className={`mb-2 text-center ${containerWidth} ${isNew ? "bg-gray-100" : ""}`}
          />
          <div className={`flex justify-end ${containerWidth}`}>
            <Button
              size="sm"
              variant="destructive"
              onClick={onRemove}
              className="text-xs"
            >
              Удалить полностью
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button
            onClick={handleStart}
            className={`${containerWidth} h-8 ${backgroundColor} text-white text-sm font-bold`}
            disabled={isDeleted}
          >
            {label}
          </Button>

          <div className={`flex items-center justify-between mt-1 ${containerWidth}`}>
            {!isDeleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                Сброс
              </Button>
            )}

            {timeLeft !== null && (
              <div className="text-sm font-bold text-gray-800 text-center flex-1">
                {formatTime(timeLeft)}
              </div>
            )}

            <div>
              {isDeleted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRestore}
                  className="text-xs"
                >
                  Восстановить
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-xs"
                >
                  Удалить
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TimerButton;
