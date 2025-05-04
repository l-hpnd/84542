import React, { useState } from "react";
import TimerButton from "./TimerButton";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

interface ButtonData {
  id: string;
  label: string;
  isDeleted: boolean;
  isNew?: boolean;
  originalIndex?: number;
}

interface GroupData {
  name: string;
  buttons: ButtonData[];
  originalButtons: ButtonData[];
}

const createFOIButtons = () => [
  "Emyli",
  "Bra1ns",
  "Qr",
  "Волосыназад",
  "CrazyFortune",
  "PANA7",
  "Djuzeppe",
  "THEORY",
].map((label) => ({
  id: uuidv4(),
  label,
  isDeleted: false,
  isNew: false,
  timeLeft: null,
  isRunning: false,
}));

const createBubbleButtons = () => [
  "Emyli",
  "Bra1ns",
  "Qr",
  "Волосыназад",
  "CrazyFortune",
  "PANA7",
  "Djuzeppe",
  "THEORY",
].map((label) => ({
  id: uuidv4(),
  label,
  isDeleted: false,
  isNew: false,
  timeLeft: null,
  isRunning: false,
}));

const createInitialButtons = () => [
  "D'9",
  "Nuance",
  "anheit",
  "NivenuS",
  "Runaway Team",
  "СиО",
  "Emyli",
  "Most Hated",
  "idc",
  "Альянс-Профи",
  "Кибер Калеки",
  "5ДА",
  "Genji-team",
  "Deadly Squad",
  "Marwin",
  "Драм Кружок",
  "InFront",
].map((label) => ({
  id: uuidv4(),
  label,
  isDeleted: false,
  isNew: false,
  timeLeft: null,
  isRunning: false,
}));

const initialGroups: GroupData[] = [
  {
    name: "FOI",
    buttons: createFOIButtons(),
    originalButtons: createFOIButtons(),
  },
  {
    name: "Bubble",
    buttons: createBubbleButtons(),
    originalButtons: createBubbleButtons(),
  },
  {
    name: "Sublime",
    buttons: createInitialButtons(),
    originalButtons: createInitialButtons(),
  },
  {
    name: "Mass Cleanse",
    buttons: createInitialButtons(),
    originalButtons: createInitialButtons(),
  },
  {
    name: "Noise",
    buttons: createInitialButtons(),
    originalButtons: createInitialButtons(),
  },
];

const groupDurations: Record<string, number> = {
  FOI: 30 * 60,
  Sublime: 28 * 60 + 50,
  "Mass Cleanse": 20 * 60,
  Noise: 15 * 60,
  Bubble: 15 * 60,
};

const GroupsContainer: React.FC = () => {
  const [groups, setGroups] = useState<GroupData[]>(initialGroups);
  const [isEditMode, setIsEditMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const toggleEditMode = () => {
    if (!isEditMode) {
      const snapshot = groups.map((g) => ({
        ...g,
        originalButtons: [...g.buttons],
      }));
      setGroups(snapshot);
    }
    setIsEditMode(!isEditMode);
  };

  const discardChanges = () => {
    const confirmed = window.confirm("Вы уверены, что хотите выйти без сохранения изменений?");
    if (!confirmed) return;

    const restored = groups.map((g) => ({
      ...g,
      buttons: [...g.originalButtons],
    }));
    setGroups(restored);
    setIsEditMode(false);
    setUnsavedChanges(false);
  };

  const addButton = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].buttons.push({
      id: uuidv4(),
      label: "Новая кнопка",
      isDeleted: false,
      isNew: true,
    });
    setGroups(newGroups);
    setUnsavedChanges(true);
  };

  const updateLabel = (groupIndex: number, buttonIndex: number, newLabel: string) => {
    const newGroups = [...groups];
    newGroups[groupIndex].buttons[buttonIndex].label = newLabel;
    setGroups(newGroups);
    setUnsavedChanges(true);
  };

  const deleteButton = (groupIndex: number, buttonIndex: number) => {
    const newGroups = [...groups];
    const btn = newGroups[groupIndex].buttons[buttonIndex];
    const updatedBtn = {
      ...btn,
      isDeleted: true,
      originalIndex: buttonIndex,
    };
    newGroups[groupIndex].buttons.splice(buttonIndex, 1);
    newGroups[groupIndex].buttons.push(updatedBtn);
    setGroups(newGroups);
    setUnsavedChanges(true);
  };

  const restoreButton = (groupIndex: number, buttonIndex: number) => {
    const newGroups = [...groups];
    const btn = newGroups[groupIndex].buttons[buttonIndex];
    const restoredBtn = { ...btn, isDeleted: false };

    newGroups[groupIndex].buttons.splice(buttonIndex, 1);

    const activeButtons = newGroups[groupIndex].buttons.filter((b) => !b.isDeleted);
    const deletedButtons = newGroups[groupIndex].buttons.filter((b) => b.isDeleted);

    const insertIndex = btn.originalIndex ?? activeButtons.length;

    const newButtonList = [...activeButtons];
    newButtonList.splice(insertIndex, 0, restoredBtn);

    newGroups[groupIndex].buttons = [...newButtonList, ...deletedButtons];

    setGroups(newGroups);
    setUnsavedChanges(true);
  };

  const removeButtonCompletely = (groupIndex: number, buttonIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].buttons.splice(buttonIndex, 1);
    setGroups(newGroups);
    setUnsavedChanges(true);
  };

  const moveGroup = (index: number, direction: "up" | "down") => {
    const newGroups = [...groups];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newGroups.length) return;

    const temp = newGroups[index];
    newGroups[index] = newGroups[newIndex];
    newGroups[newIndex] = temp;

    setGroups(newGroups);
    setUnsavedChanges(true);
  };

  return (
    <div className="p-4 space-y-8">
      <div className="flex justify-end gap-2 mb-4">
        {isEditMode && (
          <Button variant="destructive" onClick={discardChanges}>
            Выйти без сохранения
          </Button>
        )}
        <Button onClick={toggleEditMode}>
          {isEditMode ? "Сохранить и выйти" : "Редактировать"}
        </Button>
      </div>

      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="border p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">{group.name}</h2>
            {isEditMode && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveGroup(groupIndex, "up")}
                  disabled={groupIndex === 0}
                >
                  ⬆️
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveGroup(groupIndex, "down")}
                  disabled={groupIndex === groups.length - 1}
                >
                  ⬇️
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-x-[1px] gap-y-[3px]">
            {group.buttons.map((btn, buttonIndex) => (
              <TimerButton
                key={btn.id}
                label={btn.label}
                groupName={group.name}
                isDeleted={btn.isDeleted}
                isNew={btn.isNew || false}
                index={buttonIndex}
                isEditMode={isEditMode}
                onDelete={() => deleteButton(groupIndex, buttonIndex)}
                onRestore={() => restoreButton(groupIndex, buttonIndex)}
                onLabelChange={(newLabel) => updateLabel(groupIndex, buttonIndex, newLabel)}
                onRemove={() => removeButtonCompletely(groupIndex, buttonIndex)}
                duration={groupDurations[group.name] || 600}
              />
            ))}
          </div>

          {isEditMode && (
            <div className="mt-4">
              <Button onClick={() => addButton(groupIndex)}>Добавить кнопку</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupsContainer;
