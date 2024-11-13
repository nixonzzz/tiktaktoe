// PlayerCountInput.js
import React, { useState } from "react";

export function PlayerCountInput({ onStartGame }) {
    const [playerCount, setPlayerCount] = useState("");
    const [error, setError] = useState("");

    const validateInput = (value) => {
        if (!/^\d+$/.test(value)) {
            setError("Введите число!");
            return false;
        } else if (value < 2 || value > 4) {
            setError("Введите число от 2 до 4!");
            return false;
        } else {
            setError("");
            return true;
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setPlayerCount(value);
        validateInput(value);
    };

    const handleStartGame = () => {
        if (validateInput(playerCount)) {
            onStartGame(parseInt(playerCount, 10));
        }
    };

    return (
        <div style={styles.container}>
            <label htmlFor="players" style={styles.label}>
                Введите количество игроков
            </label>
            <input
                type="text"
                id="players"
                value={playerCount}
                onChange={handleChange}
                placeholder="Количество игроков"
                style={{
                    ...styles.input,
                    borderColor: error ? "red" : "#e2e8f0",
                }}
            />
            {error && <div style={styles.error}>{error}</div>}
            <button
                onClick={handleStartGame}
                disabled={!!error}
                style={{
                    ...styles.button,
                    backgroundColor: error ? "#cbd5e0" : "rgb(13 148 136 / var(--tw-bg-opacity))",
                    color: error ? "#718096" : "#ffffff",
                    cursor: error ? "not-allowed" : "pointer",
                }}
            >
                Играть
            </button>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        padding: "1.5rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    label: {
        color: "gray",
        fontSize: "1rem",
        marginBottom: "0.5rem",
        textAlign: "center",
    },
    input: {
        width: "100%",
        padding: "0.75rem",
        fontSize: "1rem",
        border: "1px solid",
        borderRadius: "0.5rem",
        outline: "none",
        transition: "border-color 0.2s",
        marginBottom: "0.5rem",
    },
    error: {
        color: "red",
        fontSize: "0.875rem",
        marginBottom: "0.5rem",
        textAlign: "center",
    },
    button: {
        padding: "0.75rem 1.5rem",
        fontSize: "1rem",
        border: "none",
        borderRadius: "0.5rem",
        width: "100%",
        maxWidth: "150px",
        textAlign: "center",
        transition: "background-color 0.3s",
    },
};
