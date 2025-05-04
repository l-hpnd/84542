import { useEffect, useState } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../firebase";
import TimerButton from "./TimerButton";
import { v4 as uuidv4 } from "uuid";

export default function GroupsContainer() {
  const [groups, setGroups] = useState([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const groupsRef = ref(db, "groups");
    return onValue(groupsRef, (snapshot) => {
      const data = snapshot.val() || [];
      setGroups(data);
    });
  }, []);

  const updateGroups = (newGroups) => {
    set(ref(db, "groups"), newGroups);
  };

  const addGroup = () => {
    const newGroup = {
      id: uuidv4(),
      name: "Новая группа",
      timerDuration: 60,
      buttons: [],
    };
    const newGroups = [...groups, newGroup];
    updateGroups(newGroups);
  };

  const addButton = (groupId) => {
    const newGroups = groups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        buttons: [
          ...group.buttons,
          { id: uuidv4(), name: "Кнопка", disabled: false },
        ],
      };
    });
    updateGroups(newGroups);
  };

  const updateButtonName = (groupId, buttonId, name) => {
    const newGroups = groups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        buttons: group.buttons.map((btn) =>
          btn.id === buttonId ? { ...btn, name } : btn
        ),
      };
    });
    updateGroups(newGroups);
  };

  const updateGroupName = (groupId, name) => {
    const newGroups = groups.map((group) =>
      group.id === groupId ? { ...group, name } : group
    );
    updateGroups(newGroups);
  };

  const updateGroupTimer = (groupId, minutes, seconds) => {
    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    const newGroups = groups.map((group) =>
      group.id === groupId ? { ...group, timerDuration: totalSeconds } : group
    );
    updateGroups(newGroups);
  };

  const softDeleteButton = (groupId, buttonId) => {
    const newGroups = groups.map((group) => {
      if (group.id !== groupId) return group;
      const btns = group.buttons.filter((b) => b.id !== buttonId);
      const deletedBtn = group.buttons.find((b) => b.id === buttonId);
      if (!deletedBtn) return group;
      deletedBtn.disabled = true;
      return {
        ...group,
        buttons: [...btns, deletedBtn],
      };
    });
    updateGroups(newGroups);
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setEditMode(!editMode)}
        className="bg-yellow-400 px-3 py-1 rounded mb-4 text-white"
      >
        {editMode ? "Выход из редактирования" : "Режим редактирования"}
      </button>
      {groups.map((group) => (
        <div key={group.id} className="mb-6 p-4 border rounded">
          {editMode ? (
            <input
              value={group.name}
              onChange={(e) => updateGroupName(group.id, e.target.value)}
              className="text-lg font-bold mb-2 border p-1"
            />
          ) : (
            <h2 className="text-xl font-bold mb-2">{group.name}</h2>
          )}

          {editMode && (
            <div className="mb-2">
              <label>Минуты:</label>
              <input
                type="number"
                min={0}
                className="border mx-2 w-16 text-center"
                defaultValue={Math.floor(group.timerDuration / 60)}
                onChange={(e) =>
                  updateGroupTimer(
                    group.id,
                    e.target.value,
                    group.timerDuration % 60
                  )
                }
              />
              <label>Секунды:</label>
              <input
                type="number"
                min={0}
                max={59}
                className="border mx-2 w-16 text-center"
                defaultValue={group.timerDuration % 60}
                onChange={(e) =>
                  updateGroupTimer(
                    group.id,
                    Math.floor(group.timerDuration / 60),
                    e.target.value
                  )
                }
              />
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {group.buttons.map((btn) => (
              <TimerButton
                key={btn.id}
                groupId={group.id}
                button={btn}
                timerDuration={group.timerDuration}
                editMode={editMode}
                onSoftDelete={softDeleteButton}
                onNameChange={updateButtonName}
              />
            ))}
          </div>

          {editMode && (
            <button
              onClick={() => addButton(group.id)}
              className="mt-3 px-2 py-1 bg-green-500 text-white rounded"
            >
              + Кнопка
            </button>
          )}
        </div>
      ))}

      {editMode && (
        <button
          onClick={addGroup}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          + Группа
        </button>
      )}
    </div>
  );
}
