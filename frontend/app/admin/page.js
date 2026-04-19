"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';

const COLORS = ['#e31e24', '#333333', '#f97316', '#00a651', '#8b5cf6'];

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    highRisk: 0,
    typeDist: [],
    trendData: [],
    flagDist: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const ADMIN_AUTH = btoa("admin:admin1234");
      const response = await fetch("http://127.0.0.1:8000/api/v1/tickets", {
        headers: { "Authorization": `Basic ${ADMIN_AUTH}` }
      });
      const data = await response.json();
      setTickets(data);
      calculateStats(data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data.length) return;

    const total = data.length;
    const avgScore = (data.reduce((acc, t) => acc + t.risk_score, 0) / total).toFixed(1);
    const highRisk = data.filter(t => t.risk_score > 70).length;

    // Type Distribution
    const types = {};
    const flags = {};
    
    data.forEach(t => {
      // Channel Distribution
      types[t.type] = (types[t.type] || 0) + 1;
      
      // Flag Distribution
      if (t.flags) {
        t.flags.split(',').forEach(f => {
          const cleanFlag = f.trim();
          if (cleanFlag) flags[cleanFlag] = (flags[cleanFlag] || 0) + 1;
        });
      }
    });

    const typeDist = Object.entries(types).map(([name, value]) => ({ name, value }));
    const flagDist = Object.entries(flags)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value);

    // Simple Trend (by date)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = {};
    // Init last 7 days
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend[days[d.getDay()]] = 0;
    }
    data.forEach(t => {
      const d = new Date(t.created_at);
      const dayName = days[d.getDay()];
      if (trend[dayName] !== undefined) trend[dayName]++;
    });
    const trendData = Object.entries(trend).map(([name, incidents]) => ({ name, incidents }));

    setStats({ total, avgScore, highRisk, typeDist, trendData, flagDist });
  };

  if (loading) return <div className="p-20 text-center font-bold opacity-40">Loading Analytics...</div>;

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">Threat Intelligence Dashboard</h1>
            <p className="text-secondary-light">Unified monitoring for Website, SMS, WhatsApp, and Email threats.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/triage" className="btn-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Review Triage
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Incidents', value: stats.total, color: 'text-secondary' },
            { label: 'Avg Risk Level', value: stats.avgScore, color: 'text-risk-medium' },
            { label: 'Critical Threats', value: stats.highRisk, color: 'text-risk-high' },
            { label: 'Active Channels', value: stats.typeDist.length, color: 'text-risk-low' },
          ].map((stat, idx) => (
            <div key={idx} className="card p-6 border-b-4 border-b-primary/10">
              <p className="text-[10px] font-black uppercase text-secondary/40 mb-1 tracking-widest">{stat.label}</p>
              <h3 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card p-8">
            <h3 className="font-black mb-6 text-sm uppercase tracking-widest opacity-50">Incident Volume (Last 7 Days)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="incidents" fill="#e31e24" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="font-black mb-6 text-sm uppercase tracking-widest opacity-50">Threat Channel Distribution</h3>
            <div className="h-64 w-full flex flex-col md:flex-row items-center justify-between">
              <div className="w-full h-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.typeDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.typeDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-4 pl-6">
                {stats.typeDist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shadow-sm" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                      <span className="font-black opacity-60 uppercase">{item.name}</span>
                    </div>
                    <span className="font-black text-secondary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Sub-Categories / Flags */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          <div className="card p-8">
            <h3 className="font-black mb-6 text-sm uppercase tracking-widest opacity-50">Security Flag Analysis (Sub-Categories)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.flagDist.length > 0 ? stats.flagDist.map((item, idx) => (
                <div key={idx} className="bg-neutral-page border border-neutral-border p-4 rounded-xl flex flex-col items-center text-center group hover:border-primary transition-all">
                  <span className="text-[10px] font-black uppercase text-secondary/40 mb-2 group-hover:text-primary transition-colors">{item.name}</span>
                  <span className="text-2xl font-black text-secondary">{item.value}</span>
                </div>
              )) : (
                <p className="col-span-full py-10 text-center opacity-40 italic font-bold">No detection flags triggered yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts Table Preview */}
        <div className="card overflow-hidden">
          <div className="px-8 py-5 border-b border-neutral-border flex items-center justify-between bg-white">
            <h3 className="font-black text-sm uppercase tracking-widest">Live Threat Feed</h3>
            <Link href="/admin/triage" className="text-[10px] font-black uppercase text-primary hover:underline px-3 py-1 bg-primary/5 rounded-full">See Full Triage →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-page text-[10px] uppercase font-black text-secondary/30">
                <tr>
                  <th className="px-8 py-4">Source</th>
                  <th className="px-8 py-4">Incident Info</th>
                  <th className="px-8 py-4 text-center">Risk</th>
                  <th className="px-8 py-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border bg-white">
                {tickets.slice(0, 5).map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-neutral-page/50 transition-colors">
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-2 py-1 rounded border ${
                        ticket.type === 'WhatsApp' ? 'border-risk-low text-risk-low' : 
                        ticket.type === 'Email' ? 'border-secondary text-secondary' : 
                        'border-primary text-primary'
                      } uppercase`}>
                        {ticket.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col max-w-xs">
                        <span className="text-xs font-bold truncate opacity-80">{ticket.url || "No URL provided"}</span>
                        <span className="text-[10px] opacity-40 font-bold truncate">{ticket.sender_numbers || "Unknown Sender"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-sm font-black ${
                        ticket.risk_score > 70 ? 'text-risk-high' : 'text-risk-medium'
                      }`}>
                        {ticket.risk_score}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link 
                        href={`/admin/investigate/${ticket.ticket_id}`}
                        className="text-[10px] font-black bg-secondary text-white px-3 py-1.5 rounded hover:bg-primary transition-all uppercase"
                      >
                        Details
                      </Link>
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
