import React, { createContext, useContext } from "react";

const ScrollChromeContext = createContext({ chromeHidden: false });

export function ScrollChromeProvider({ chromeHidden = false, children }) {
  return (
    <ScrollChromeContext.Provider value={{ chromeHidden: !!chromeHidden }}>
      {children}
    </ScrollChromeContext.Provider>
  );
}

export function useScrollChrome() {
  return useContext(ScrollChromeContext);
}
