import React, { createContext, useContext, ReactNode } from "react";
import useSettings from "@/hooks/use-settings";
import { ReadwiseDocument } from "@/hooks/use-readwise-data";

// Define the type for the settings
export interface AppSettings {
  readwiseAccessToken: string | undefined;
  data: ReadwiseDocument[];
}

// Define the shape of the context value
interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  getSettings: () => Promise<AppSettings>;
}

// Create the context with a default value of `null`
const SettingsContext = createContext<SettingsContextValue | null>(null);

// Provider Component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const defaultSettings: AppSettings = {
    readwiseAccessToken: undefined,
    data: [],
  };

  const [settings, updateSettings, getSettings] = useSettings<AppSettings>(
    "readwise-stats-settings",
    defaultSettings,
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, getSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the SettingsContext
export const useAppSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within a SettingsProvider");
  }
  return context;
};
