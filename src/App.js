import React, { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";

function App() {
  // States
  const [name, setName] = useState("");
  const [data, setData] = useState([
    { ambient: "", bird: "", behavior: "Low Altitude" },
  ]);
  const [reflections, setReflections] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6a: "",
    q6b: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [sessionId] = useState(() => "S" + Date.now().toString().slice(-6));

  // Reflection questions
  const reflectionQuestions = {
    q1: "Q1 – Prediction & Misconception:\nWhy do you think birds move into their feathers when the ambient temperature is low and out of their feathers when the ambient temperature is high?",
    q2: "Q2 – Data Interpretation (Low Altitude):\nBased on the data, describe what happens to body temperature with increasing ambient when behavior is Low Altitude.",
    q3: "Q3 – Data Interpretation (High Altitude):\nBased on the data, describe what happens to body temperature with increasing ambient when behavior is High Altitude.",
    q4: "Q4 – Observation & Analysis:\nDo body temperatures change a lot with ambient temperature change? What does this imply?",
    q5: "Q5 – Scientific Explanation:\nIf body temperature remains almost constant despite ambient changes, what concept explains it?",
    q6a: "Q6a – Reflection:\nDid your initial hypothesis match your observations? Explain.",
    q6b: "Q6b – Reflection:\nWhat does your data show about the role of behavior in maintaining homeostasis?"
  };

  // Handle table cell edit
  const handleEdit = (index, field, value) => {
    const newData = data.map((row, i) => {
      if (i === index) {
        return {
          ...row,
          [field]:
            field === "ambient" || field === "bird"
              ? parseFloat(value) || ""
              : value,
        };
      } else {
        return row;
      }
    });
    setData(newData);
  };

  const handleAddRow = () => {
    setData([...data, { ambient: "", bird: "", behavior: "Low Altitude" }]);
  };

  const handleDeleteRow = (index) => {
    setData(data.filter((_, i) => i !== index));
  };

  const handleReflectionChange = (key, value) => {
    setReflections({ ...reflections, [key]: value });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!name) {
      setModalMessage("Please enter your name / student ID.");
      setModalOpen(true);
      return;
    }

    const validReadings = data.filter(
      (d) => !isNaN(d.ambient) && !isNaN(d.bird)
    );

    if (validReadings.length === 0) {
      setModalMessage("Please enter at least one valid reading.");
      setModalOpen(true);
      return;
    }

    // Prepare all readings to match Apps Script
    const body = new URLSearchParams();
    body.append("sessionId", sessionId);
    body.append("name", name);
    body.append("numRows", validReadings.length);
    body.append("q1", reflections.q1);
    body.append("q2", reflections.q2);
    body.append("q3", reflections.q3);
    body.append("q4", reflections.q4);
    body.append("q5", reflections.q5);
    body.append("q6a", reflections.q6a);
    body.append("q6b", reflections.q6b);

    validReadings.forEach((entry, i) => {
      body.append(`ambient${i}`, entry.ambient);
      body.append(`bird${i}`, entry.bird);
      body.append(`behavior${i}`, entry.behavior);
    });

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbwLCETmaa3CmKYrBxHMZek7FB-WFFgQJNsio0FtUSAVV3kA4FvVHZgmzyIYuNcYDxEr/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body,
        }
      );
      setModalMessage("✅ Submission Complete! All readings sent successfully.");
      // Reset table & reflections
      setData([{ ambient: "", bird: "", behavior: "Low Altitude" }]);
      setReflections({ q1: "", q2: "", q3: "", q4: "", q5: "", q6a: "", q6b: "" });
      setName("");
    } catch (err) {
      console.error(err);
      setModalMessage("Failed to submit readings. Please try again.");
    }

    setModalOpen(true);
  };

  // Trend lines data
  const sortedData = data
    .filter((d) => !isNaN(d.ambient) && !isNaN(d.bird))
    .sort((a, b) => a.ambient - b.ambient);
  const trendLow = sortedData.filter((d) => d.behavior === "Low Altitude");
  const trendHigh = sortedData.filter((d) => d.behavior === "High Altitude");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Bird Thermoregulation Investigation
      </h1>
      <p style={{ textAlign: "center", color: "gray" }}>
        Session ID: <strong>{sessionId}</strong>
      </p>

      {/* Name */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Name / Student ID:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "4px", border: "1px solid #ccc" }}
          placeholder="Enter your name or ID"
        />
      </div>

      {/* Editable Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>#</th>
            <th>Ambient Temp (°C)</th>
            <th>Bird Temp (°C)</th>
            <th>Behavior</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #ccc", textAlign: "center" }}>{idx + 1}</td>
              <td style={{ border: "1px solid #ccc" }}>
                <input
                  type="number"
                  value={row.ambient}
                  onChange={(e) => handleEdit(idx, "ambient", e.target.value)}
                  style={{ width: "100%", padding: "6px", border: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ border: "1px solid #ccc" }}>
                <input
                  type="number"
                  value={row.bird}
                  onChange={(e) => handleEdit(idx, "bird", e.target.value)}
                  style={{ width: "100%", padding: "6px", border: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ border: "1px solid #ccc" }}>
                <select
                  value={row.behavior}
                  onChange={(e) => handleEdit(idx, "behavior", e.target.value)}
                  style={{ width: "100%", padding: "6px", border: "none", textAlign: "center" }}
                >
                  <option>Low Altitude</option>
                  <option>High Altitude</option>
                </select>
              </td>
              <td style={{ border: "1px solid #ccc", textAlign: "center" }}>
                <button
                  onClick={() => handleDeleteRow(idx)}
                  style={{ backgroundColor: "#e53935", color: "white", border: "none", padding: "4px 8px", cursor: "pointer", borderRadius: "4px" }}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleAddRow}
        style={{ backgroundColor: "#1976d2", color: "white", border: "none", padding: "8px 12px", cursor: "pointer", borderRadius: "4px", marginBottom: "1rem" }}
      >
        ➕ Add Row
      </button>

      {/* Scatter + Trend Lines */}
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="ambient" label={{ value: "Ambient Temp (°C)", position: "bottom" }} />
          <YAxis type="number" dataKey="bird" label={{ value: "Bird Temp (°C)", angle: -90, position: "insideLeft" }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: 10 }} />

          <Scatter
            name="Low Altitude"
            data={data.filter(d => d.behavior === "Low Altitude" && d.ambient && d.bird).map(d => ({ ...d, ambient: d.ambient - 0.2 }))}
            fill="#1e88e5"
          />
          <Scatter
            name="High Altitude"
            data={data.filter(d => d.behavior === "High Altitude" && d.ambient && d.bird).map(d => ({ ...d, ambient: d.ambient + 0.2 }))}
            fill="#e91e63"
          />

          <Line type="monotone" dataKey="bird" data={trendLow} stroke="#1e88e5" dot={false} name="Low Altitude Trend" />
          <Line type="monotone" dataKey="bird" data={trendHigh} stroke="#e91e63" dot={false} name="High Altitude Trend" />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Reflection Questions */}
      <div style={{ marginTop: "1rem" }}>
        {Object.entries(reflectionQuestions).map(([key, question]) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "bold", whiteSpace: "pre-wrap" }}>{question}</label>
            <textarea
              value={reflections[key]}
              onChange={(e) => handleReflectionChange(key, e.target.value)}
              style={{ width: "100%", padding: "6px", marginTop: "4px" }}
              placeholder="Type your answer here"
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{ marginTop: "1rem", backgroundColor: "green", color: "white", border: "none", padding: "10px 16px", cursor: "pointer", fontSize: "1rem", borderRadius: "4px" }}
      >
        Submit All Readings
      </button>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "8px", maxWidth: "400px", textAlign: "center" }}>
            <p>{modalMessage}</p>
            <button onClick={() => setModalOpen(false)} style={{ marginTop: "1rem", backgroundColor: "#1976d2", color: "white", border: "none", padding: "8px 16px", cursor: "pointer", borderRadius: "4px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
