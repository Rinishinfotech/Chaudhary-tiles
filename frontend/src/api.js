import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BASE}/api`;

const client = axios.create({ baseURL: API });

export const api = {
  // auth
  login: (userId, pin) => client.post('/auth/login', { userId, pin }).then(r => r.data),
  // team
  getTeam: () => client.get('/team').then(r => r.data),
  addTeam: (d) => client.post('/team', d).then(r => r.data),
  updateTeam: (id, d) => client.put(`/team/${id}`, d).then(r => r.data),
  deleteTeam: (id) => client.delete(`/team/${id}`).then(r => r.data),
  // parties
  getParties: () => client.get('/parties').then(r => r.data),
  addParty: (d) => client.post('/parties', d).then(r => r.data),
  updateParty: (id, d) => client.put(`/parties/${id}`, d).then(r => r.data),
  deleteParty: (id) => client.delete(`/parties/${id}`).then(r => r.data),
  // receipts
  getReceipts: () => client.get('/receipts').then(r => r.data),
  addReceipt: (d) => client.post('/receipts', d).then(r => r.data),
  updateReceipt: (id, d) => client.put(`/receipts/${id}`, d).then(r => r.data),
  deleteReceipt: (id) => client.delete(`/receipts/${id}`).then(r => r.data),
  // expenses
  getExpenses: () => client.get('/expenses').then(r => r.data),
  addExpense: (d) => client.post('/expenses', d).then(r => r.data),
  updateExpense: (id, d) => client.put(`/expenses/${id}`, d).then(r => r.data),
  transfer: (d) => client.post('/expenses/transfer', d).then(r => r.data),
  updateExpenseStatus: (id, status) => client.put(`/expenses/${id}/status`, { status }).then(r => r.data),
  deleteExpense: (id) => client.delete(`/expenses/${id}`).then(r => r.data),
  // categories
  getCategories: () => client.get('/categories').then(r => r.data),
  addCategory: (name) => client.post('/categories', { name }).then(r => r.data),
  deleteCategory: (id) => client.delete(`/categories/${id}`).then(r => r.data),
  // stock
  getStock: () => client.get('/stock').then(r => r.data),
  addStock: (d) => client.post('/stock', d).then(r => r.data),
  deleteStock: (id) => client.delete(`/stock/${id}`).then(r => r.data),
  adjustStock: (d) => client.post('/stock/adjust', d).then(r => r.data),
  inwardCement: (d) => client.post('/stock/inward-cement', d).then(r => r.data),
  // production
  getProduction: () => client.get('/production').then(r => r.data),
  addProduction: (d) => client.post('/production', d).then(r => r.data),
  updateProduction: (id, d) => client.put(`/production/${id}`, d).then(r => r.data),
  deleteProduction: (id) => client.delete(`/production/${id}`).then(r => r.data),
  // dispatches
  getDispatches: () => client.get('/dispatches').then(r => r.data),
  addDispatch: (d) => client.post('/dispatches', d).then(r => r.data),
  fulfillDispatch: (id, d) => client.post(`/dispatches/${id}/fulfill`, d).then(r => r.data),
  deleteDispatch: (id) => client.delete(`/dispatches/${id}`).then(r => r.data),
  // challans
  getChallans: () => client.get('/challans').then(r => r.data),
  addChallan: (d) => client.post('/challans', d).then(r => r.data),
  updateChallan: (id, d) => client.put(`/challans/${id}`, d).then(r => r.data),
  deleteChallan: (id) => client.delete(`/challans/${id}`).then(r => r.data),
  // wallet
  walletSummary: () => client.get('/wallet/summary').then(r => r.data),
  // notifications / approvals
  getNotifications: () => client.get('/notifications').then(r => r.data),
  getApprovals: () => client.get('/approvals').then(r => r.data),
  deleteApproval: (id) => client.delete(`/approvals/${id}`).then(r => r.data),
  // firm / dashboard / reports
  getFirm: () => client.get('/firm').then(r => r.data),
  updateFirm: (d) => client.put('/firm', d).then(r => r.data),
  dashboardSummary: () => client.get('/dashboard/summary').then(r => r.data),
  reports: (fromDate, toDate) => client.get('/reports', { params: { from_date: fromDate || undefined, to_date: toDate || undefined } }).then(r => r.data),
  backup: () => client.get('/backup').then(r => r.data),
  resetSystem: () => client.post('/system/reset').then(r => r.data),
};

export const inr = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = (s) => {
  if (!s) return '-';
  const p = s.split('-');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : s;
};
export const todayStr = () => new Date().toISOString().split('T')[0];

export function printDocument(title, bodyHtml) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) { alert('Please allow pop-ups to download/print the document.'); return; }
  w.document.write(`<!doctype html><html><head><title>${title}</title>
  <style>
    * { font-family: 'Poppins', Arial, sans-serif; box-sizing: border-box; }
    body { margin: 0; padding: 30px; color: #1e293b; }
    .doc-head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0b1f3a; padding-bottom:16px; margin-bottom:20px; }
    .firm-name { font-size:24px; font-weight:700; color:#0b1f3a; }
    .firm-sub { font-size:12px; color:#555; margin-top:4px; }
    .doc-title { background:#0b1f3a; color:#ffc107; padding:6px 14px; border-radius:8px; font-weight:700; font-size:14px; }
    .meta { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; margin-bottom:20px; font-size:13px; }
    .meta div span { color:#64748b; font-weight:600; display:block; font-size:11px; text-transform:uppercase; }
    table { width:100%; border-collapse:collapse; margin-top:10px; font-size:13px; }
    th,td { border:1px solid #cbd5e1; padding:8px 10px; text-align:left; }
    th { background:#f1f5f9; color:#0b1f3a; }
    .total-row { font-weight:700; font-size:16px; color:#0b1f3a; margin-top:16px; text-align:right; }
    .foot { margin-top:40px; display:flex; justify-content:space-between; font-size:12px; color:#555; }
    .sign { border-top:1px solid #94a3b8; padding-top:6px; width:180px; text-align:center; }
  </style></head><body>${bodyHtml}
  <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  w.document.close();
}
