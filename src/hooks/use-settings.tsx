import { useState, useEffect } from "react";
import localforage from "localforage";

function useSettings<T>(
  key: string,
  defaultSettings: T,
): [T, (newSettings: Partial<T>) => void, () => Promise<T>] {
  const [settings, setSettings] = useState<T>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const storedSettings = await localforage.getItem<T>(key);
        if (storedSettings) {
          setSettings({ ...defaultSettings, ...storedSettings });
        }
      } catch (error) {
        console.error("Error fetching settings from storage", error);
      }
    };

    fetchSettings();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = async (newSettings: Partial<T>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await localforage.setItem(key, updatedSettings);
    } catch (error) {
      console.error("Error saving settings to storage", error);
    }
  };

  const getSettings = async (): Promise<T> => {
    try {
      const storedSettings = await localforage.getItem<T>(key);
      return storedSettings
        ? { ...defaultSettings, ...storedSettings }
        : defaultSettings;
    } catch (error) {
      console.error("Error getting settings from storage", error);
      return defaultSettings;
    }
  };

  return [settings, updateSettings, getSettings];
}

export default useSettings;
