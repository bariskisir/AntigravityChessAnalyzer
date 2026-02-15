import React, { useState, useEffect } from "react";
import "./SettingsModal.css";

const SettingsModal = ({ show, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === "depth" || name === "variants" || name === "maxThinkingTime") {
            finalValue = parseInt(value);

            if (name === "depth") {
                if (finalValue > 18) finalValue = 18;
                if (finalValue < 10) finalValue = 10;
            } else if (name === "variants") {
                if (finalValue > 5) finalValue = 5;
                if (finalValue < 1) finalValue = 1;
            } else if (name === "maxThinkingTime") {
                if (finalValue > 100) finalValue = 100;
                if (finalValue < 10) finalValue = 10;
            }
        }

        setLocalSettings((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Engine Settings</h3>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>API</label>
                        <select
                            name="apiUrl"
                            value={localSettings.apiUrl}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                background: "#333",
                                color: "#fff",
                                border: "1px solid #444",
                                borderRadius: "4px",
                            }}
                        >
                            <option value="https://chess-api.com/v1">
                                Stockfish 17 (chess-api.com)
                            </option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Depth (10-18)</label>
                        <input
                            type="number"
                            name="depth"
                            value={localSettings.depth}
                            onChange={handleChange}
                            min="10"
                            max="18"
                        />
                    </div>
                    <div className="form-group">
                        <label>Variants</label>
                        <select
                            name="variants"
                            value={localSettings.variants}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                background: "#333",
                                color: "#fff",
                                border: "1px solid #444",
                                borderRadius: "4px",
                            }}
                        >
                            <option value={1}>1</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Thinking Time (50-100 ms)</label>
                        <input
                            type="number"
                            name="maxThinkingTime"
                            value={localSettings.maxThinkingTime}
                            onChange={handleChange}
                            min="50"
                            max="100"
                            step="10"
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="save-btn" onClick={() => onSave(localSettings)}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
