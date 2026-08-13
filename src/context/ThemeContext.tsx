import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "Light" | "Dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "Light",
  setTheme: () => {},
});

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = useState<Theme>("Light");

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(
      theme === "Dark" ? "dark" : "light"
    );
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);