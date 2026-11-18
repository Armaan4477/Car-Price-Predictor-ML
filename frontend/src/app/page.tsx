"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Car, TrendingDown, BarChart3, Loader2 } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("predictor");
  
  const [filters, setFilters] = useState<any>({});
  const [dashboardData, setDashboardData] = useState<any>({});
  
  const [formData, setFormData] = useState({
    Brand: "",
    Car_Model: "",
    Car_Variant: "",
    Year: 2019,
    KM_Driven: 45000,
    Fuel_Type: "Petrol",
    Transmission_Type: "Manual",
    Owner_Count: 1,
    City: "Mumbai",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ predicted_price_lakhs: number; predicted_price_inr: number } | null>(null);
  const [depreciationData, setDepreciationData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filtersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/filters`);
        if (filtersRes.ok) {
          const filtersJson = await filtersRes.json();
          setFilters(filtersJson);
          
          const firstBrand = Object.keys(filtersJson).sort()[0];
          if (firstBrand) {
            const firstModel = Object.keys(filtersJson[firstBrand]).sort()[0];
            const firstVariant = filtersJson[firstBrand][firstModel].sort()[0];
            setFormData(prev => ({ ...prev, Brand: firstBrand, Car_Model: firstModel, Car_Variant: firstVariant }));
          }
        }
        
        const dashRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard-data`);
        if (dashRes.ok) {
          setDashboardData(await dashRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchData();
  }, []);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brand = e.target.value;
    const firstModel = Object.keys(filters[brand] || {}).sort()[0] || "";
    const firstVariant = filters[brand]?.[firstModel]?.sort()[0] || "";
    setFormData(prev => ({ ...prev, Brand: brand, Car_Model: firstModel, Car_Variant: firstVariant }));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    const firstVariant = filters[formData.Brand]?.[model]?.sort()[0] || "";
    setFormData(prev => ({ ...prev, Car_Model: model, Car_Variant: firstVariant }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["Year", "KM_Driven", "Owner_Count"].includes(name) ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    setDepreciationData([]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to predict price.");
      }

      setResult(await res.json());

      const depRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict-depreciation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (depRes.ok) {
        const depData = await depRes.json();
        setDepreciationData(depData.depreciation_curve);
      }
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']; // Cyan, Purple, Pink, Emerald, Amber

  // Shared classes for inputs to keep it DRY
  const inputClassName = "mt-1 block w-full rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 px-4 py-3 shadow-inner focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none";

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans pb-20">
      
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl font-extrabold tracking-tight flex justify-center items-center gap-4 text-white mb-4">
              <Car className="h-12 w-12 text-cyan-400" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                AutoPredict AI
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              State-of-the-art machine learning algorithms forecasting the Indian used car market with high precision.
            </p>
          </motion.div>
          
          {/* Tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center space-x-2 mt-12">
            <button
              onClick={() => setActiveTab("predictor")}
              className={`px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                activeTab === "predictor" 
                  ? "bg-slate-800 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-slate-700" 
                  : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Valuation Engine
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                activeTab === "insights" 
                  ? "bg-slate-800 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)] border border-slate-700" 
                  : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Market Intelligence
            </button>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        
        <AnimatePresence mode="wait">
          {activeTab === "predictor" && (
            <motion.div 
              key="predictor"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              
              {/* Form Column */}
              <div className="lg:col-span-5 bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400 ml-1">Brand</label>
                    <select name="Brand" value={formData.Brand} onChange={handleBrandChange} required className={inputClassName}>
                      {Object.keys(filters).sort().map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 ml-1">Car Model</label>
                    <select name="Car_Model" value={formData.Car_Model} onChange={handleModelChange} required className={inputClassName}>
                      {Object.keys(filters[formData.Brand] || {}).sort().map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 ml-1">Variant</label>
                    <select name="Car_Variant" value={formData.Car_Variant} onChange={handleChange} required className={inputClassName}>
                      {(filters[formData.Brand]?.[formData.Car_Model] || []).sort().map((v: string) => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 ml-1">Year</label>
                      <input type="number" name="Year" required min="1990" max={new Date().getFullYear()} value={formData.Year} onChange={handleChange} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 ml-1">KM Driven</label>
                      <input type="number" name="KM_Driven" required min="0" value={formData.KM_Driven} onChange={handleChange} className={inputClassName} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 ml-1">Fuel</label>
                      <select name="Fuel_Type" required value={formData.Fuel_Type} onChange={handleChange} className={inputClassName}>
                        {["Petrol", "Diesel", "CNG", "Electric", "Hybrid"].map(f => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 ml-1">Transmission</label>
                      <select name="Transmission_Type" required value={formData.Transmission_Type} onChange={handleChange} className={inputClassName}>
                        <option value="Manual" className="bg-slate-900">Manual</option>
                        <option value="Automatic" className="bg-slate-900">Automatic</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 ml-1">Owners</label>
                      <input type="number" name="Owner_Count" required min="1" max="10" value={formData.Owner_Count} onChange={handleChange} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 ml-1">City</label>
                      <input type="text" name="City" required value={formData.City} onChange={handleChange} placeholder="Mumbai" className={inputClassName} />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className={`mt-4 w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2 ${isLoading ? "opacity-75 cursor-not-allowed scale-[0.98]" : "active:scale-[0.98]"}`}>
                    {isLoading ? <><Loader2 className="animate-spin h-5 w-5" /> Processing Engine...</> : "Generate Valuation"}
                  </button>
                </form>
                
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-200 text-sm">
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Results Column */}
              <div className="lg:col-span-7 space-y-6">
                {result ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-6">
                    
                    {/* Price Card */}
                    <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />
                      <div className="p-10 text-center relative z-10">
                        <p className="text-slate-400 font-medium mb-4 tracking-widest uppercase text-sm">Estimated Market Value</p>
                        <h2 className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 drop-shadow-lg">
                          ₹{result.predicted_price_lakhs} <span className="text-4xl text-slate-500">Lakh</span>
                        </h2>
                        <div className="mt-6 inline-block bg-slate-900/50 rounded-full px-6 py-2 border border-white/5">
                          <p className="text-cyan-400 font-mono text-lg">≈ ₹{result.predicted_price_inr.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Depreciation Chart */}
                    {depreciationData.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-xl font-bold text-white">Value Depreciation</h3>
                            <p className="text-sm text-slate-400 mt-1">Projected over the next 5 years (assuming +10k km/year)</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                            <TrendingDown className="h-5 w-5 text-cyan-400" />
                          </div>
                        </div>
                        
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={depreciationData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                              <XAxis dataKey="year_offset" tickFormatter={(val) => `+${val} Yrs`} stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                              <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `₹${val}L`} stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                itemStyle={{ color: '#22d3ee' }}
                                formatter={(value: any) => [`₹${value} Lakh`, "Projected Value"]}
                                labelFormatter={(label) => `In ${label} Years`}
                              />
                              <Line type="monotone" dataKey="predicted_price_lakhs" stroke="#22d3ee" strokeWidth={4} dot={{ r: 6, fill: "#0f172a", stroke: "#22d3ee", strokeWidth: 2 }} activeDot={{ r: 8, fill: "#22d3ee" }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50 border-dashed flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full" />
                      <Car className="h-20 w-20 text-slate-600 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-300 mt-6">Awaiting Input</h3>
                    <p className="text-slate-500 mt-3 max-w-sm text-lg">Initialize the AI valuation engine by submitting the vehicle parameters.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "insights" && dashboardData.avg_price_by_brand && (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Avg Price by Brand */}
                <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <span className="w-2 h-6 bg-cyan-500 rounded-full" /> Top Brand Valuations (Lakhs)
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.avg_price_by_brand.sort((a:any, b:any) => b.AveragePrice - a.AveragePrice).slice(0, 8)} margin={{ top: 5, right: 5, bottom: 40, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="Brand" angle={-45} textAnchor="end" height={60} interval={0} fontSize={13} stroke="#94a3b8" axisLine={false} tickLine={false} dy={15} />
                        <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                          cursor={{ fill: '#334155', opacity: 0.4 }}
                          formatter={(val: number) => [`₹${val.toFixed(2)} L`, 'Avg Price']} 
                        />
                        <Bar dataKey="AveragePrice" radius={[6, 6, 0, 0]}>
                          {dashboardData.avg_price_by_brand.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fuel Type Distribution */}
                <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <span className="w-2 h-6 bg-purple-500 rounded-full" /> Market Share by Fuel Type
                  </h3>
                  <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.fuel_type_dist}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="Count"
                          nameKey="Fuel_Type"
                          stroke="none"
                        >
                          {dashboardData.fuel_type_dist.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-bold text-white">
                        {dashboardData.fuel_type_dist.reduce((acc: number, curr: any) => acc + curr.Count, 0)}
                      </span>
                      <span className="text-sm text-slate-400">Total Cars</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
