"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import styles from "./Dashboard.module.css";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [perfData, setPerfData] = useState<any[]>([]);
  const [campData, setCampData] = useState<any[]>([]);
  const [keyData, setKeyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAcc, setSelectedAcc] = useState("All");
  const [selectedCamp, setSelectedCamp] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      const { data: perf } = await supabase.from("performance").select("*");
      const { data: camps } = await supabase.from("campaigns").select("*");
      const { data: keys } = await supabase.from("keywords").select("*");

      if (perf) setPerfData(perf);
      if (camps) setCampData(camps);
      if (keys) setKeyData(keys);
      setLoading(false);
    }
    fetchAllData();
  }, []);

  // API Discovery Logic for dropdowns
  const accList = Array.from(new Set(perfData.map(i => i.account_name).filter(Boolean)));
  const campList = Array.from(new Set(perfData
    .filter(i => selectedAcc === "All" || i.account_name === selectedAcc)
    .map(i => i.campaign_name).filter(Boolean)));
  const typeList = Array.from(new Set(campData.map(i => i.status).filter(Boolean)));

  const filteredPerf = perfData.filter(i =>
    (selectedAcc === "All" || i.account_name === selectedAcc) &&
    (selectedCamp === "All" || i.campaign_name === selectedCamp)
  );

  const spend = filteredPerf.reduce((a, b) => a + (Number(b.cost_micros) || 0), 0) / 1000000;
  const clicks = filteredPerf.reduce((a, b) => a + (Number(b.clicks) || 0), 0);
  const imps = filteredPerf.reduce((a, b) => a + (Number(b.impressions) || 0), 0);

  if (loading) return <div className={styles.loader}><span></span></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ads Overview</h1>
        <div className={styles.filterBar}>
          <div className={styles.dateGroup}>
            <input type="date" className={styles.inputField} />
            <span className={styles.separator}>—</span>
            <input type="date" className={styles.inputField} />
          </div>

          <select className={styles.inputField} value={selectedAcc} onChange={(e) => { setSelectedAcc(e.target.value); setSelectedCamp("All"); }}>
            <option value="All">Account: All ({accList.length})</option>
            {accList.map(acc => <option key={acc} value={acc}>{acc}</option>)}
          </select>

          <select className={styles.inputField} value={selectedCamp} onChange={(e) => setSelectedCamp(e.target.value)}>
            <option value="All">Campaign: All</option>
            {campList.map(camp => <option key={camp} value={camp}>{camp}</option>)}
          </select>

          <select className={styles.inputField} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="All">Type: All</option>
            {typeList.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Spend</span>
          <h2 className={styles.statValue}>${spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <div className={styles.progressBar}><div style={{ width: '70%' }}></div></div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Clicks</span>
          <h2 className={styles.statValue}>{clicks.toLocaleString()}</h2>
          <div className={styles.progressBar}><div style={{ width: '45%' }}></div></div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Impressions</span>
          <h2 className={styles.statValue}>{imps.toLocaleString()}</h2>
          <div className={styles.progressBar}><div style={{ width: '85%' }}></div></div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Spending Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredPerf}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="cost_micros" stroke="#000" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.listCard}>
          <h3 className={styles.sectionTitle}>Campaign Status</h3>
          <div className={styles.listWrapper}>
            {campData.filter(c => selectedAcc === "All" || c.account_name === selectedAcc).map((camp, idx) => (
              <div key={idx} className={styles.listItem}>
                <div>
                  <p className={styles.itemName}>{camp.campaign_name}</p>
                  <p className={styles.itemSub}>{camp.campaign_id}</p>
                </div>
                <span className={styles.badge}>{camp.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.detailsFull}>
        <h3 className={styles.sectionTitle}>Keywords Analysis</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Clicks</th>
              <th>Spend</th>
            </tr>
          </thead>
          <tbody>
            {keyData.filter(k => selectedAcc === "All" || k.account_name === selectedAcc).map((key, idx) => (
              <tr key={idx}>
                <td className={styles.tableBold}>{key.keyword_text}</td>
                <td>{key.clicks}</td>
                <td>${(key.cost_micros / 1000000).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}