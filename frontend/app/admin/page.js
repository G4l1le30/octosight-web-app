"use client";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';

const dataTrend = [
  { name: 'Mon', incidents: 12 },
  { name: 'Tue', incidents: 19 },
  { name: 'Wed', incidents: 15 },
  { name: 'Thu', incidents: 22 },
  { name: 'Fri', incidents: 30 },
  { name: 'Sat', incidents: 10 },
  { name: 'Sun', incidents: 8 },
];

const dataModus = [
  { name: 'Typosquatting', value: 45 },
  { name: 'Account Blocked', value: 25 },
  { name: 'Prize/Lottery', value: 20 },
  { name: 'MFA Phishing', value: 10 },
];

const COLORS = ['#e31e24', '#333333', '#f97316', '#00a651'];

export default function AdminDashboard() {
  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">Analytics Dashboard</h1>
            <p className="text-secondary-light">Monitoring phishing trends and detection performance.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/triage" className="btn-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Manage Triage
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Tickets', value: '1,422', change: '+12%', color: 'text-secondary' },
            { label: 'Avg Risk Score', value: '64.2', change: '-4%', color: 'text-risk-medium' },
            { label: 'High Risk (Danger)', value: '154', change: '+24%', color: 'text-risk-high' },
            { label: 'Detection Rate', value: '88.5%', change: '+1.2%', color: 'text-risk-low' },
          ].map((stat, idx) => (
            <div key={idx} className="card p-6">
              <p className="text-xs font-black uppercase text-secondary/50 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h3>
                <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-risk-low' : 'text-risk-high'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card p-6">
            <h3 className="font-black mb-6 text-lg">Weekly Incident Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="incidents" fill="#e31e24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-black mb-6 text-lg">Phishing Modus Distribution</h3>
            <div className="h-64 w-full flex flex-col md:flex-row items-center justify-between">
              <div className="w-full h-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataModus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataModus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3 pl-4">
                {dataModus.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx]}}></div>
                      <span className="font-medium opacity-70">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts Table Preview */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-border flex items-center justify-between">
            <h3 className="font-black">Recent High-Risk Alerts</h3>
            <Link href="/admin/triage" className="text-xs font-bold text-primary hover:underline">View All Tickets</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-page text-xs uppercase font-black text-secondary/40">
                <tr>
                  <th className="px-6 py-3">Ticket ID</th>
                  <th className="px-6 py-3">Target URL</th>
                  <th className="px-6 py-3">Risk Score</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {[
                  { id: '#OCTO-8821', url: 'https://cimb-niaga-verif.net/login', score: 92, priority: 'High', status: 'Submitted' },
                  { id: '#OCTO-8822', url: 'https://security-cimb.xyz/blocked', score: 88, priority: 'High', status: 'In Review' },
                  { id: '#OCTO-8825', url: 'https://clmbniaga-bonus.tk/claim', score: 95, priority: 'High', status: 'Submitted' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-page transition-colors">
                    <td className="px-6 py-4 font-bold text-sm">{row.id}</td>
                    <td className="px-6 py-4 text-sm font-mono opacity-70">{row.url}</td>
                    <td className="px-6 py-4">
                      <span className="font-black text-risk-high">{row.score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-risk-high/10 text-risk-high text-[10px] font-black px-2 py-1 rounded uppercase">Critical</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold opacity-60 italic">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
