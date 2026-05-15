import KpiCard from '../components/KpiCard'

const KPI = ({ kpis }) => (
  <section id="kpi" data-section className="section">
    <div className="section-inner">
      <div className="section-heading">
        <p className="eyebrow">KPI</p>
        <h2>Les indicateurs qui cadrent la trajectoire.</h2>
      </div>
      <div className="kpi-grid">
        {kpis.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  </section>
)

export default KPI
