"use client";

import { useEffect } from "react";
import "./Notification.css";

interface NotificationProps {
  message: string;
  onClose: () => void;
}

export default function Notification({ message, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification">
      <p>{message}</p>
      <button onClick={onClose} className="close-notification-button">
        &times;
      </button>
    </div>
  );
}
