import React, { createContext, useState, useContext, useCallback } from "react";
import "../components/common/Notification.css";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [
      ...prev,
      { id, message, type, isDropping: false },
    ]);

    // Auto dismiss after 6 seconds (slightly longer for "slow" feel)
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isDropping: true } : n))
    );

    // Wait for animation to finish before removing from DOM
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 600); // Match CSS animation duration
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notification ${n.type} ${
              n.isDropping ? "dropping" : ""
            }`}
            onClick={() => removeNotification(n.id)}
            title="Click to dismiss"
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
