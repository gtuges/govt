import React, { useState, useEffect, useRef } from "react";
import { useFiscalYear } from "../../context/FiscalYearContext";
import { Calendar, Search, Check, X } from "lucide-react";
import "./FiscalYearSelector.css";

const FiscalYearSelector = () => {
  const { selectedYear, selectYear, availableYears, loading } = useFiscalYear();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter years based on search
  const filteredYears = availableYears.filter((year) =>
    year.toString().includes(searchTerm)
  );

  // Focus search input when modal opens
  useEffect(() => {
    if (isModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isModalOpen]);

  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsModalOpen(false);
        setSearchTerm("");
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsModalOpen(false);
      setSearchTerm("");
    } else if (e.key === "Enter" && filteredYears.length === 1) {
      handleSelectYear(filteredYears[0]);
    }
  };

  const handleSelectYear = (year) => {
    selectYear(year);
    setIsModalOpen(false);
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="fiscal-year-card loading">
        <Calendar size={18} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <>
      {/* Fiscal Year Card */}
      <button
        className="fiscal-year-card"
        onClick={() => setIsModalOpen(true)}
        title="Click to change fiscal year"
      >
        <div className="fiscal-year-icon">
          <Calendar size={18} />
        </div>
        <div className="fiscal-year-info">
          <span className="fiscal-year-label">Fiscal Year</span>
          <span className="fiscal-year-value">FY {selectedYear}</span>
        </div>
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fiscal-year-modal-overlay">
          <div
            className="fiscal-year-modal"
            ref={modalRef}
            onKeyDown={handleKeyDown}
          >
            <div className="modal-header">
              <h3>Select Fiscal Year</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-search">
              <Search size={18} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="modal-year-list">
              {filteredYears.length === 0 ? (
                <div className="no-results">No matching years found</div>
              ) : (
                filteredYears.map((year) => (
                  <button
                    key={year}
                    className={`year-option ${
                      year === selectedYear ? "selected" : ""
                    }`}
                    onClick={() => handleSelectYear(year)}
                  >
                    <span className="year-text">FY {year}</span>
                    {year === selectedYear && (
                      <Check size={18} className="check-icon" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="modal-footer">
              <span className="current-hint">
                Current: <strong>FY {selectedYear}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FiscalYearSelector;
