import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const FiscalYearContext = createContext();

export const useFiscalYear = () => useContext(FiscalYearContext);

export const FiscalYearProvider = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState(() => {
    // Try to get from localStorage, default to current year
    const saved = localStorage.getItem("selectedFiscalYear");
    return saved ? parseInt(saved, 10) : new Date().getFullYear();
  });
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available years from API
  useEffect(() => {
    fetch("http://localhost:3000/api/objectives/years/available")
      .then((res) => res.json())
      .then((years) => {
        setAvailableYears(years);
        // If saved year is not in the list, default to current year or first available
        if (years.length > 0 && !years.includes(selectedYear)) {
          const currentYear = new Date().getFullYear();
          if (years.includes(currentYear)) {
            setSelectedYear(currentYear);
          } else {
            setSelectedYear(years[0]);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching fiscal years:", err);
        // Fallback: generate years from current year - 5 to current year + 1
        const currentYear = new Date().getFullYear();
        const fallbackYears = [];
        for (let y = currentYear - 5; y <= currentYear + 1; y++) {
          fallbackYears.push(y);
        }
        setAvailableYears(fallbackYears.reverse());
        setLoading(false);
      });
  }, []);

  // Persist selected year to localStorage
  const selectYear = useCallback((year) => {
    setSelectedYear(year);
    localStorage.setItem("selectedFiscalYear", year.toString());
  }, []);

  return (
    <FiscalYearContext.Provider
      value={{
        selectedYear,
        selectYear,
        availableYears,
        loading,
      }}
    >
      {children}
    </FiscalYearContext.Provider>
  );
};

export default FiscalYearContext;
