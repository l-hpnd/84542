// Login.tsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const FIXED_PASSWORD = "knopkihuyopki"; // 🔒 задай свой пароль здесь

export const Login = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, FIXED_PASSWORD);
    } catch (err: any) {
      setError("Ошибка входа: " + err.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="p-4 max-w-sm mx-auto space-y-3 border rounded shadow">
      <h2 className="text-lg font-bold">Вход</h2>
      <input
        className="w-full border p-2"
        type="email"
        placeholder="Введите email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
        Войти
      </button>
    </form>
  );
};