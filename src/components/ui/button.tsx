import React from "react";
export const Button = ({ children, ...props }: any) => (
  <button className="px-2 py-1 rounded bg-blue-500 text-white" {...props}>{children}</button>
);
