"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface BasicModeContextType {
  basicMode: boolean;
  toggleBasicMode: () => void;
}

const BasicModeContext = createContext<BasicModeContextType>({
  basicMode: false,
  toggleBasicMode: () => {},
});

export const useBasicMode = () => useContext(BasicModeContext);

export const BasicModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [basicMode, setBasicMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("octosight_basic_mode");
    if (saved === "true") setBasicMode(true);
  }, []);

  const toggleBasicMode = () => {
    const next = !basicMode;
    setBasicMode(next);
    localStorage.setItem("octosight_basic_mode", String(next));
    document.documentElement.classList.toggle("basic-mode", next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("basic-mode", basicMode);
  }, [basicMode]);

  return (
    <BasicModeContext.Provider value={{ basicMode, toggleBasicMode }}>
      {children}
    </BasicModeContext.Provider>
  );
};
