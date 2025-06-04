import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { Login } from "./Login";
import GroupsContainer from "./components//GroupsContainer"; // твой основной интерфейс

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  return (
    <div className="p-4">
      {user ? <GroupsContainer user={user} /> : <Login />}
    </div>
  );
}

export default App;