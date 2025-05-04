import React from "react";
import ButtonTimer from "./TimerButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Group({
  groupId,
  groupName,
  groupButtons,
  onGroupNameChange,
  onButtonsChange,
  isEditing,
}) {
  const handleAddButton = () => {
    const newId = `btn-${Date.now()}`;
    const updatedButtons = {
      ...groupButtons,
      [newId]: {
        name: "New Button",
        duration: 60,
        order: Object.keys(groupButtons).length,
        active: true,
      },
    };
    onButtonsChange(updatedButtons);
  };

  const handleNameChange = (e) => {
    onGroupNameChange(e.target.value);
  };

  return (
    <div className="border rounded-2xl shadow p-4 space-y-4 bg-white">
      <div className="flex justify-between items-center">
        {isEditing ? (
          <Input value={groupName} onChange={handleNameChange} className="text-xl font-bold" />
        ) : (
          <h2 className="text-xl font-bold">{groupName}</h2>
        )}
        {isEditing && (
          <Button size="sm" onClick={handleAddButton}>
            + Add Button
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(groupButtons)
          .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
          .map(([id, data]) => (
            <ButtonTimer
              key={id}
              id={id}
              data={data}
              onChange={(newData) =>
                onButtonsChange({ ...groupButtons, [id]: newData })
              }
              isEditing={isEditing}
            />
          ))}
      </div>
    </div>
  );
}
