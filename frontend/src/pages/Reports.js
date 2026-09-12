import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api, inr } from '../api';

export default function Reports() {
  const [data, setData] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadReports = (f = fromDate, t = toDate) => api.reports(f, t).then(setData).catch(() => {});
  useEffect(() => { loadReports('', ''); }, []);

  const applyRange = () => loadReports(fromDate, toDate);
  const resetRange = () => { setFromDate(''); setToDate(''); loadReports('', ''); };

  const exportCSV = async () => {
    const parties = await api.getParties();
    let csv = 'data:text/csv;charset=utf-8,Party Name,Contact,Amount,Due Balance\n';
    parties.forEach((p) => { csv += `"${p.name}","${p.contact || ''}",${p.amount || 0},${p.dues || 0}\n`; });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'Chaudhary_Tiles_Party_Ledger_Report.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!data) return <Layout searchPlaceholder="Search report metrics..."><div /></Layout>;

  return (
    <Layout searchPlaceholder="Search report metrics...">
      <div className="page-title">
        <h2><i className="fa fa-chart-line" style={{ color: '#ffc107' }}></i> Financial &amp; Production Reports Master</h2>
        <button className="btn-export" onClick={exportCSV}><i className="fa fa-file-excel"></i> Export Ledger CSV</button>
      </div>

      <div className="filter-card">
        <div className="filter-group"><label><i className="fa fa-calendar-days" style={{ color: '#0b1f3a' }}></i> From:</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
        <div className="filter-group"><label>To:</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
        <button className="btn-action" onClick={applyRange}><i className="fa fa-filter"></i> Apply Range</button>
        <button className="btn-filter-reset" onClick={resetRange}><i className="fa fa-rotate"></i> Reset</button>
        <div className="summary-badge">{fromDate || toDate ? `${fromDate || 'Start'} → ${toDate || 'Today'}` : 'All Time Data'}</div>
      </div>

      <div className="report-grid">
        <div className="report-card green"><h4>Total Collection (Receipts)</h4><div className="count">{inr(data.totalReceipts)}</div><div className="sub"><i className="fa fa-arrow-down" style={{ color: '#059669' }}></i> Total Collections Logged</div></div>
        <div className="report-card red"><h4>Total Expenses Logged</h4><div className="count">{inr(data.totalExpenses)}</div><div className="sub"><i className="fa fa-arrow-up" style={{ color: '#dc3545' }}></i> Plant &amp; Fuel Expenses</div></div>
        <div className="report-card yellow"><h4>Outstanding Party Dues</h4><div className="count">{inr(data.totalDues)}</div><div className="sub"><i className="fa fa-triangle-exclamation" style={{ color: '#d97706' }}></i> Uncollected Receivables</div></div>
        <div className="report-card"><h4>Total Production Output</h4><div className="count">{data.totalProduction.toLocaleString()} Pcs</div><div className="sub"><i className="fa fa-industry"></i> Sipara + Nandlal Chhapra</div></div>
        <div className="report-card"><h4>Total Dispatch (Pieces)</h4><div className="count">{(data.totalDispatch || 0).toLocaleString()} Pcs</div><div className="sub"><i className="fa fa-truck" style={{ color: '#2563eb' }}></i> Delivered via D-Challans</div></div>
      </div>

      <div className="section-grid">
        <div className="card-box">
          <h3><span><i className="fa fa-user-clock" style={{ color: '#d97706' }}></i> Top Outstanding Parties</span></h3>
          <table><thead><tr><th>Party Name</th><th>Contact</th><th>Amount</th><th>Due Balance</th></tr></thead><tbody>
            {data.topDues.map((p, i) => <tr key={i}><td><strong>{p.name}</strong></td><td>{p.contact || '-'}</td><td>{inr(p.amount)}</td><td><strong style={{ color: '#dc3545' }}>{inr(p.dues)}</strong></td></tr>)}
            {data.topDues.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>No outstanding dues</td></tr>}
          </tbody></table>
        </div>
        <div className="card-box">
          <h3><span><i className="fa fa-money-bill-transfer" style={{ color: '#dc3545' }}></i> Plant Expense Highlights</span></h3>
          <table><thead><tr><th>Category</th><th>Recipient</th><th>Amount</th></tr></thead><tbody>
            {data.recentExpenses.map((e, i) => <tr key={i}><td><strong>{e.category}</strong></td><td>{e.plant}</td><td><strong style={{ color: '#dc3545' }}>{inr(e.amount)}</strong></td></tr>)}
            {data.recentExpenses.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>No expenses logged</td></tr>}
          </tbody></table>
        </div>
      </div>
    </Layout>
  );
}
