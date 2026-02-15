import React from "react";
import { X } from "lucide-react";
import "../App.css";

const SettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSave,
  availableBooks,
}) => {
  if (!isOpen) return null;

  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({
      ...prev,
      [name]: name === "bookUrl" ? value : parseInt(value, 10),
    }));
  };

  const handleSave = () => {
    const newSettings = {
      depth: Math.min(18, Math.max(1, localSettings.depth)),
      variants: Math.min(5, Math.max(1, localSettings.variants)),
      maxThinkingTime: Math.min(
        100,
        Math.max(1, localSettings.maxThinkingTime),
      ),
      bookUrl: localSettings.bookUrl,
    };
    onSave(newSettings);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Analysis Settings</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Depth (1-18)</label>
            <input
              type="number"
              name="depth"
              min="1"
              max="18"
              value={localSettings.depth}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Multipv (Variants 1-5)</label>
            <input
              type="number"
              name="variants"
              min="1"
              max="5"
              value={localSettings.variants}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Max Thinking Time (ms)</label>
            <input
              type="number"
              name="maxThinkingTime"
              min="1"
              max="100"
              value={localSettings.maxThinkingTime}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Opening Book</label>
            <select
              name="bookUrl"
              value={localSettings.bookUrl || "/books/Perfect2021.bin"}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px",
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 4,
              }}
            >
              {availableBooks &&
                availableBooks.map((b) => (
                  <option key={b.url} value={b.url}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handleSave} className="save-btn">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
