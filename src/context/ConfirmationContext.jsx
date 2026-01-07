import React, { createContext, useState, useContext, useCallback } from "react";
import "../components/common/ConfirmationModal.css";

const ConfirmationContext = createContext();

export const useConfirmation = () => useContext(ConfirmationContext);

export const ConfirmationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    message: "",
    title: "Confirm Action",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback((message, onConfirm, title = "Are you sure?") => {
    setConfig({
      message,
      title,
      onConfirm: () => {
        onConfirm();
        setIsOpen(false);
      },
      onCancel: () => setIsOpen(false),
    });
    setIsOpen(true);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <h3>{config.title}</h3>
            <p>{config.message}</p>
            <div className="confirmation-actions">
              <button className="btn-cancel" onClick={config.onCancel}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={config.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};
