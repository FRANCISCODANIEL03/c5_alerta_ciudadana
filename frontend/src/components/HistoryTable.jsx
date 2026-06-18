import React, { useState, useEffect } from "react";

function HistoryTable() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para controlar los filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [zone, setZone] = useState("");
  const [priority, setPriority] = useState("");

  // Función para consumir el MS de Historial vía REST aplicando los filtros
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (startDate && endDate) {
        queryParams.append("start_date", `${startDate} 00:00:00`);
        queryParams.append("end_date", `${endDate} 23:59:59`);
      }

      if (zone) {
        queryParams.append("zone", zone);
      }

      if (priority) {
        queryParams.append("priority_level", priority);
      }

      const url = `http://localhost:4000/api/historial?${queryParams.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setHistory(result.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de la alerta
  const handleNotify = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/historial/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          // Enviamos el nuevo estado que queremos guardar
          body: JSON.stringify({ status: "notificada" }),
        },
      );

      if (response.ok) {
        // Volvemos a consultar el historial para que la tabla se actualice en pantalla
        fetchHistory();
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  };

  useEffect(() => {
    // Carga inicial del historial
    fetchHistory();
  }, []);

  return (
    <>
      <div className="card-header history-header-wrapper">
        <div className="header-left">
          <span className="card-title">
            AUDITORÍA DE INCIDENTES (POSTGRESQL)
          </span>
        </div>

        <div className="history-filters">
          <div className="search-box">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Fecha de inicio"
            />
          </div>
          <div className="search-box">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Fecha de fin"
            />
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Escriba una zona..."
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
          </div>

          <select
            className="tactical-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">TODAS LAS PRIORIDADES</option>
            <option value="crítico">CRÍTICO</option>
            <option value="alto">ALTO</option>
            <option value="medio">MEDIO</option>
          </select>

          <button className="btn btn-sm btn-neon-blue" onClick={fetchHistory}>
            FILTRAR
          </button>
        </div>
      </div>

      <div className="history-table-container scrollbar-custom">
        <table className="tactical-table">
          <thead>
            <tr>
              <th>ID ALERTA</th>
              <th>TIMESTAMP</th>
              <th>DISPOSITIVO</th>
              <th>TIPO</th>
              <th>ZONA</th>
              <th>COORDENADAS</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-muted)",
                  }}
                >
                  No hay registros que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.alert_id}>
                  <td className="cell-id">{row.alert_id.split("-")[0]}...</td>
                  <td className="cell-time">
                    {new Date(row.timestamp).toLocaleString()}
                  </td>
                  <td className="cell-esp32">{row.device_id}</td>
                  <td style={{ textTransform: "uppercase" }}>
                    {row.emergency_type}
                  </td>
                  <td>{row.zone}</td>
                  <td className="cell-gps">
                    {row.lat}, {row.lon}
                  </td>
                  <td>
                    <span
                      className={`badge-status ${row.status.toLowerCase() === "notificada" ? "status-green" : "status-red"}`}
                    >
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {/* El botón solo se renderiza si el estado es 'pendiente' */}
                    {row.status.toLowerCase() === "pendiente" && (
                      <button
                        className="btn btn-sm btn-neon-blue"
                        onClick={() => handleNotify(row.alert_id)}
                      >
                        NOTIFICAR
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span className="pagination-info">
          Mostrando registros de la réplica de lectura
        </span>
        <div className="pagination-controls">
          <button className="btn-page" disabled>
            &lt;
          </button>
          <button className="btn-page active">1</button>
          <button className="btn-page">&gt;</button>
        </div>
      </div>
    </>
  );
}

export default HistoryTable;
