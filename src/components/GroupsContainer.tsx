import React, { useEffect, useState } from "react";
import { ref, onValue, set, update, push } from "firebase/database";
import { db } from "../firebase"; // путь к твоему firebase.ts
import TimerButton from "./TimerButton";
import { v4 as uuidv4 } from "uuid";

type Button = {
  id: string;
  name: string;
  duration: number;
  startedAt: number | null;
  isActive: boolean;
};

type Group = {
  id: string;
  name: string;
  buttons: Record<string, Button>;
};

const GroupsContainer: React.FC = () => {
  const [groups, setGroups] = useState<Record<string, Group>>({});

  // Подписка на все группы
  useEffect(() => {
    const groupsRef = ref(db, "groups");
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGroups(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddButton = (groupId: string) => {
    const buttonId = uuidv4();
    const buttonRef = ref(db, `groups/${groupId}/buttons/${buttonId}`);
    set(buttonRef, {
      id: buttonId,
      name: `New Button`,
      duration: 30,
      startedAt: null,
      isActive: true,
    });
  };

  const handleGroupNameChange = (groupId: string, newName: string) => {
    const groupNameRef = ref(db, `groups/${groupId}`);
    update(groupNameRef, { name: newName });
  };

  const handleAddGroup = () => {
    const groupId = uuidv4();
    const groupRef = ref(db, `groups/${groupId}`);
    set(groupRef, {
      id: groupId,
      name: "New Group",
      buttons: {},
    });
  };

  return (
    <div className="p-4 space-y-4">
      {Object.entries(groups).map(([groupId, group]) => (
        <div key={groupId} className="border rounded p-2 shadow">
          <input
            className="text-lg font-semibold mb-2 border-b outline-none"
            value={group.name}
            onChange={(e) => handleGroupNameChange(groupId, e.target.value)}
          />
          <div className="flex flex-wrap">
            {group.buttons &&
              Object.entries(group.buttons).map(([buttonId, button]) => (
                <TimerButton
                  key={buttonId}
                  groupId={groupId}
                  buttonId={buttonId}
                  name={button.name}
                  duration={button.duration}
                  isActive={button.isActive}
                />
              ))}
          </div>
          <button
            onClick={() => handleAddButton(groupId)}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            + Add Button
          </button>
        </div>
      ))}
      <button
        onClick={handleAddGroup}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
      >
        + Add Group
      </button>
    </div>
  );
};

export default GroupsContainer;
