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
  const [name, setName] = useState("");
  const [data, setData] = useState([
    { ambient: "", bird: "", behavior: "Low Altitude" },
  ]);
  const [reflections, setReflections] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q6a: "",
    q7: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [sessionId, setSessionId] = useState(
    () => "S" + Date.now().toString().slice(-6)
  );
  const [loading, setLoading] = useState(false);

  const q6Options = [
    "Some Birds are considered warm-blooded or homeothermic.",
    "This is because they engage in behavioural thermoregulation.",
    "Thermoregulation describes the processes by which warm-blooded animals sustain their metabolic heat through mechanisms of thermotaxis.",
    "Thermotaxis includes birds converging and dispersing to retain and give off heat, huddling,",
    "Warm-blooded animals engage in thermotaxis to retain the murine thermoneutral zone.",
    "The murine thermoneutral zone is the zone at which warm-blooded animals maintain a stable core body temperature through their engagement in thermotaxis.",
    "Warm-blooded animals can be within this murine thermoneutral zone by observing the limit of normothermia.",
    "This is the measure of how effectively endotherms maintain a stable core temperature during a decrease or increase in the ambient temperature",
  ];

  const handleEdit = (index, field, value) => {
    setData((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === "ambient" || field === "bird"
                  ? parseFloat(value) || ""
                  : value,
            }
          : row
      )
    );
  };

  const handleAddRow = () => {
    setData((prev) => [
      ...prev,
      { ambient: "", bird: "", behavior: "Low Altitude" },
    ]);
  };

  const handleDeleteRow = (index) => {
    setData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReflectionChange = (key, value) => {
    setReflections({ ...reflections, [key]: value });
  };

  const handleCheckboxChange = (option) => {
    setReflections((prev) => {
      const currentSelections = prev.q6a ? prev.q6a.split("; ").filter(item => item !== "") : [];
      
      if (currentSelections.includes(option)) {
        const updatedSelections = currentSelections.filter((o) => o !== option);
        return { ...prev, q6a: updatedSelections.join("; ") };
      } else {
        const updatedSelections = [...currentSelections, option];
        return { ...prev, q6a: updatedSelections.join("; ") };
      }
    });
  };

  const isOptionSelected = (option) => {
    return reflections.q6a ? reflections.q6a.split("; ").includes(option) : false;
  };

  // --- Fixed Submit handler that matches Google Apps Script structure ---
  const handleSubmit = async () => {
    if (!name) {
      setModalMessage("Please enter your Name.");
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

    setLoading(true);

    try {
      // Prepare form data to match Google Apps Script expectations
      const formData = new URLSearchParams();
      
      // Add basic parameters
      formData.append('sessionId', sessionId);
      formData.append('name', name);
      formData.append('q1', reflections.q1);
      formData.append('q2', reflections.q2);
      formData.append('q3', reflections.q3);
      formData.append('q4', reflections.q4);
      formData.append('q6a', reflections.q6a);
      formData.append('q7', reflections.q7);
      formData.append('numRows', data.length.toString());

      // Add table data in the format expected by Google Apps Script
      data.forEach((row, index) => {
        formData.append(`ambient${index}`, row.ambient || "");
        formData.append(`bird${index}`, row.bird || "");
        formData.append(`behavior${index}`, row.behavior || "");
      });

      console.log("Submitting form data:", Object.fromEntries(formData));

      // Send as form data (not JSON)
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxCXGMUU_yG6-GP5yLZrWXIqvoeyNo6f5PEojV6ivs6582xJhpBvJ7WSv4Je4HzzwB7/exec",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      console.log("Google Apps Script response:", result);

      if (result.status === "success") {
        setSubmitted(true);
        setModalMessage("✅ Submission Complete! Data saved to Google Sheets.");
        setModalOpen(true);
      } else {
        throw new Error(result.message || "Unknown error from server");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setModalMessage(`❌ Failed to submit: ${err.message}. Check console for details.`);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setName("");
    setData([{ ambient: "", bird: "", behavior: "Low Altitude" }]);
    setReflections({ q1: "", q2: "", q3: "", q4: "", q6a: "", q7: "" });
    setSubmitted(false);
    setSessionId("S" + Date.now().toString().slice(-6));
  };

  // --- Trend lines ---
  const sortedData = [...data]
    .filter((d) => !isNaN(d.ambient) && !isNaN(d.bird))
    .sort((a, b) => a.ambient - b.ambient);
  const trendLow = sortedData.filter((d) => d.behavior === "Low Altitude");
  const trendHigh = sortedData.filter((d) => d.behavior === "High Altitude");

  return (
    <div
      id="exportSection"
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
        maxWidth: "900px",
        margin: "0 auto",
        background: "#fdfdfd",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#2c3e50" }}>
        Bird Thermoregulation Investigation
      </h1>
      <p style={{ textAlign: "center", color: "gray" }}>
        Session ID: <strong>{sessionId}</strong>
      </p>

      {/* Name */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Name:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "4px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
          placeholder="Enter your name"
          disabled={submitted}
        />
      </div>

      {/* Pre-Test Questions */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          1. The bird's movement can be classified as converging and dispersing. Prove this assumption underpinning the bird's movement pattern with a focus on the geometric shapes and their properties at which they converge or disperse.
        </label>
        <textarea
          value={reflections.q1}
          onChange={(e) => handleReflectionChange("q1", e.target.value)}
          style={{ width: "100%", padding: "10px", minHeight: "80px", marginBottom: "8px" }}
          disabled={submitted}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          2. Name possible scientific principles and concepts which underpin the birds' convergence and dispersion in relation to the changes in ambient temperature?
        </label>
        <textarea
          value={reflections.q2}
          onChange={(e) => handleReflectionChange("q2", e.target.value)}
          style={{ width: "100%", padding: "10px", minHeight: "80px", marginBottom: "8px" }}
          disabled={submitted}
        />
      </div>

      {/* Questions 3 and 4 BEFORE table */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          3. Using the table and graph, record the values for the temperature at which the birds converge, diverge and their corresponding ambient temperature.
        </label>
        <textarea
          value={reflections.q3}
          onChange={(e) => handleReflectionChange("q3", e.target.value)}
          style={{ width: "100%", padding: "10px", minHeight: "80px", marginBottom: "8px" }}
          disabled={submitted}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          4. Interpret the data collected in the table and its visualization on the graph. You can follow the sentence beginner: As ambient temperature increases, decreases(changes), the birds' temperature...
        </label>
        <textarea
          value={reflections.q4}
          onChange={(e) => handleReflectionChange("q4", e.target.value)}
          style={{ width: "100%", padding: "10px", minHeight: "80px", marginBottom: "8px" }}
          disabled={submitted}
        />
      </div>

      {/* Table */}
      <h3>Workshop Temperature Readings Table</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "1rem",
          background: "white",
        }}
      >
        <thead>
          <tr style={{ background: "#e3f2fd" }}>
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
              <td style={{ border: "1px solid #ccc", textAlign: "center", width: "5%" }}>
                {idx + 1}
              </td>
              <td style={{ border: "1px solid #ccc" }}>
                <input
                  type="number"
                  value={row.ambient}
                  onChange={(e) => handleEdit(idx, "ambient", e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "none", textAlign: "center" }}
                  disabled={submitted}
                />
              </td>
              <td style={{ border: "1px solid #ccc" }}>
                <input
                  type="number"
                  value={row.bird}
                  onChange={(e) => handleEdit(idx, "bird", e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "none", textAlign: "center" }}
                  disabled={submitted}
                />
              </td>
              <td style={{ border: "1px solid #ccc" }}>
                <select
                  value={row.behavior}
                  onChange={(e) => handleEdit(idx, "behavior", e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "none", textAlign: "center" }}
                  disabled={submitted}
                >
                  <option>Low Altitude</option>
                  <option>High Altitude</option>
                </select>
              </td>
              <td style={{ border: "1px solid #ccc", textAlign: "center", width: "10%" }}>
                {!submitted && (
                  <button
                    onClick={() => handleDeleteRow(idx)}
                    style={{
                      backgroundColor: "#e53935",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!submitted && (
        <button
          onClick={handleAddRow}
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          ➕ Add Row
        </button>
      )}

      {/* Graph */}
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="ambient" label={{ value: "Ambient Temp (°C)", position: "bottom" }} />
          <YAxis type="number" dataKey="bird" label={{ value: "Bird Temp (°C)", angle: -90, position: "insideLeft" }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend verticalAlign="top" align="center" />
          <Scatter name="Low Altitude" data={trendLow} fill="#1e88e5" />
          <Scatter name="High Altitude" data={trendHigh} fill="#e91e63" />
          <Line type="monotone" dataKey="bird" data={trendLow} stroke="#1e88e5" dot={false} name="Low Altitude Trend" />
          <Line type="monotone" dataKey="bird" data={trendHigh} stroke="#e91e63" dot={false} name="High Altitude Trend" />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Remaining Questions (now Q6 and Q7 after the graph) */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          5. Choose the scientific concepts and principles that describe the processes of the birds' convergent and divergent evolution. (select all that apply)
        </label>
        {q6Options.map((option, i) => (
          <div key={i}>
            <input
              type="checkbox"
              checked={isOptionSelected(option)}
              onChange={() => handleCheckboxChange(option)}
              disabled={submitted}
            />{" "}
            {option}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          6. What revisions, if any, will you make to your pretest based on the workshop experience?
        </label>
        <textarea
          value={reflections.q7}
          onChange={(e) => handleReflectionChange("q7", e.target.value)}
          style={{ width: "100%", padding: "10px", minHeight: "80px", marginBottom: "8px" }}
          disabled={submitted}
        />
      </div>

      {/* Buttons */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: loading ? "gray" : "green",
              color: "white",
              border: "none",
              padding: "10px 16px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              borderRadius: "4px",
              marginRight: "1rem",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Submitting..." : "Submit All Readings"}
          </button>
        )}
        {submitted && (
          <>
            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: "#d84315",
                color: "white",
                border: "none",
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: "1rem",
                borderRadius: "4px",
                marginRight: "1rem",
              }}
            >
              Export to PDF / Print
            </button>
            <button
              onClick={startNewSession}
              style={{
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: "1rem",
                borderRadius: "4px",
              }}
            >
              Start New Session
            </button>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <p>{modalMessage}</p>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: "1rem",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                padding: "8px 16px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body {
              margin: 20mm;
              -webkit-print-color-adjust: exact;
            }
            input, textarea, select {
              font-size: 14px;
              height: auto !important;
              border: 1px solid #ccc !important;
              background: white !important;
            }
            button {
              display: none;
            }
            .no-print {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
}

export default App;