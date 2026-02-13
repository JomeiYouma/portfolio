const KpiCard = ({ item }) => (
  <div className="kpi-card">
    <p className="kpi-value">{item.value}</p>
    <div className="kpi-meta">
      <p className="kpi-label">{item.label}</p>
      <p className="kpi-detail">{item.detail}</p>
    </div>
  </div>
)

export default KpiCard
