"use client";
import "./DeleteConfirmation.css";
import "../buttons.css";

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onClose: () => void;
  message: string;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ message, onConfirm, onClose }) => {
    return (
        <div className="delete-confirmation-overlay">
            <div className="delete-confirmation-content">
                <div className="delete-confirmation-header">
                    <h2 className="delete-confirmation-title">Confirm Deletion</h2>
                </div>
                <div className="delete-confirmation-body">
                    <p>{message}</p>
                </div>
                <div className="delete-confirmation-footer">
                    <button onClick={onClose} className="btn btn-light">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="btn btn-delete">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmation;
