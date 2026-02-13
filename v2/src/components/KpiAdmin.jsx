import { useEffect, useState, useCallback } from 'react'
import kpis from '../data/kpi.json'
import './KpiAdmin.css'

const KpiAdmin = ({ onClose }) => {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: '0:00',
    bounceRate: '0%',
    topProjects: [],
    interactions: {
      ctaClicks: 0,
      cvDownloads: 0,
      emailClicks: 0,
      socialClicks: 0,
    },
  })

  // Simulate loading analytics data
  useEffect(() => {
    // In a real implementation, you would fetch from an analytics API
    const storedData = localStorage.getItem('portfolio-analytics')
    if (storedData) {
      setAnalytics(JSON.parse(storedData))
    } else {
      // Demo data
      setAnalytics({
        pageViews: Math.floor(Math.random() * 5000) + 1000,
        uniqueVisitors: Math.floor(Math.random() * 2000) + 500,
        avgSessionDuration: `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        bounceRate: `${Math.floor(Math.random() * 40) + 20}%`,
        topProjects: ['Portfolio V2', 'E-commerce App', 'Dashboard UI'],
        interactions: {
          ctaClicks: Math.floor(Math.random() * 500) + 100,
          cvDownloads: Math.floor(Math.random() * 200) + 50,
          emailClicks: Math.floor(Math.random() * 150) + 30,
          socialClicks: Math.floor(Math.random() * 300) + 80,
        },
      })
    }
  }, [])

  // Track interaction
  const trackInteraction = useCallback((type) => {
    setAnalytics((prev) => {
      const newData = {
        ...prev,
        interactions: {
          ...prev.interactions,
          [type]: prev.interactions[type] + 1,
        },
      }
      localStorage.setItem('portfolio-analytics', JSON.stringify(newData))
      return newData
    })
  }, [])

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(analytics, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="kpi-admin-overlay" onClick={onClose}>
      <div className="kpi-admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kpi-admin-header">
          <h2>📊 Analytics Dashboard</h2>
          <p className="kpi-hint">Press Alt + A + K to close</p>
          <button className="kpi-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="kpi-sections">
          <section className="kpi-section">
            <h3>📈 Traffic Overview</h3>
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-value">{analytics.pageViews.toLocaleString()}</span>
                <span className="kpi-label">Page Views</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{analytics.uniqueVisitors.toLocaleString()}</span>
                <span className="kpi-label">Unique Visitors</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{analytics.avgSessionDuration}</span>
                <span className="kpi-label">Avg. Session</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{analytics.bounceRate}</span>
                <span className="kpi-label">Bounce Rate</span>
              </div>
            </div>
          </section>

          <section className="kpi-section">
            <h3>🖱️ User Interactions</h3>
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-value">{analytics.interactions.ctaClicks}</span>
                <span className="kpi-label">CTA Clicks</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{analytics.interactions.cvDownloads}</span>
                <span className="kpi-label">CV Downloads</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{analytics.interactions.emailClicks}</span>
                <span className="kpi-label">Email Clicks</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{analytics.interactions.socialClicks}</span>
                <span className="kpi-label">Social Clicks</span>
              </div>
            </div>
          </section>

          <section className="kpi-section">
            <h3>🎯 KPI Metrics</h3>
            <div className="kpi-metrics-list">
              {kpis.map((kpi) => (
                <div key={kpi.id} className="kpi-metric-row">
                  <span className="metric-icon">{kpi.icon}</span>
                  <div className="metric-info">
                    <span className="metric-label">{kpi.label}</span>
                    <span className="metric-desc">{kpi.description}</span>
                  </div>
                  <span className="metric-value">{kpi.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="kpi-section">
            <h3>🔥 Top Projects</h3>
            <ul className="top-projects-list">
              {analytics.topProjects.map((project, index) => (
                <li key={index}>
                  <span className="rank">#{index + 1}</span>
                  <span className="project-name">{project}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="kpi-admin-footer">
          <button className="btn ghost" onClick={exportData}>
            Export JSON
          </button>
          <button className="btn primary" onClick={onClose}>
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default KpiAdmin
