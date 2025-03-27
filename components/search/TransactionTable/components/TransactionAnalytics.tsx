import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, ArrowDown, RefreshCcw, TrendingUp, Activity, Clock, Coins, BarChart2, PieChart, Sparkles, Zap, Calendar } from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { Transaction } from "../types";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionAnalyticsProps {
  transactions: Transaction[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Card component for dashboard metrics
interface DashboardCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  colorClass?: string;
  onHover?: () => void;
  isHovered?: boolean;
}

function DashboardCard({ 
  title, value, icon, badge, children, 
  colorClass = "from-amber-900/10 to-amber-800/5", 
  onHover, isHovered 
}: DashboardCardProps) {
  return (
    <motion.div 
      className={`relative overflow-hidden rounded-xl border border-amber-500/10 bg-gradient-to-br ${colorClass} p-4 transition-all`}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => onHover?.()}
      animate={isHovered ? { boxShadow: "0 0 15px 0 rgba(245,176,86,0.3)" } : {}}
    >
      {/* Subtle animated background effect */}
      {isHovered && (
        <motion.div 
          className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          initial={{ x: -200 }}
          animate={{ x: 400 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
      )}
      
      <div className="flex justify-between items-start">
        <CardDescription className="text-gray-400">{title}</CardDescription>
        {icon}
      </div>
      <CardTitle className="text-2xl mt-1 text-white">{value}</CardTitle>
      {badge && <div className="mt-1">{badge}</div>}
      {children && <div className="mt-2">{children}</div>}
    </motion.div>
  );
}

// Chart card component
interface ChartCardProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}
function ChartCard({ title, icon, children, className = "" }: ChartCardProps) {
  return (
    <motion.div
      className={`rounded-xl border border-amber-500/10 bg-gradient-to-br from-gray-800/30 to-gray-900/30 overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ boxShadow: "0 0 20px 0 rgba(245,176,86,0.15)" }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </motion.div>
  );
}

export default function TransactionAnalytics({
  transactions,
  isOpen,
  onOpenChange,
}: TransactionAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Group transactions by date for the time series chart
  const timeSeriesData = useMemo(() => {
    const dateMap = new Map<string, { date: string, count: number, volume: number }>();
    
    // Sort transactions by timestamp
    const sortedTxs = [...transactions].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    sortedTxs.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      const existingData = dateMap.get(date) || { date, count: 0, volume: 0 };
      const volume = parseFloat(tx.value.split(' ')[0]) || 0;
      
      dateMap.set(date, {
        date,
        count: existingData.count + 1,
        volume: existingData.volume + volume
      });
    });
    
    return Array.from(dateMap.values()).map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd')
    }));
  }, [transactions]);
  
  // Calculate gas costs
  const gasData = useMemo(() => {
    let totalGasUsed = 0;
    let totalGasCost = 0;
    
    const gasPerType = new Map<string, { type: string, gasUsed: number }>();
    
    transactions.forEach(tx => {
      const txType = tx.type || 'unknown';
      const gasUsed = tx.gasUsed || 0;
      const gasPrice = tx.gasPrice || 0;
      const gasCost = (gasUsed * gasPrice) / 1e9; // Convert to ETH
      
      totalGasUsed += gasUsed;
      totalGasCost += gasCost;
      
      const existingData = gasPerType.get(txType) || { type: txType, gasUsed: 0 };
      gasPerType.set(txType, {
        type: txType,
        gasUsed: existingData.gasUsed + gasUsed
      });
    });
    
    return {
      totalGasUsed,
      totalGasCost,
      gasPerType: Array.from(gasPerType.values())
        .sort((a, b) => b.gasUsed - a.gasUsed)
        .map(item => ({
          ...item,
          // Scale down for better visualization
          displayUsed: Math.log10(item.gasUsed + 1) * 100
        }))
    };
  }, [transactions]);
  
  // Calculate transaction type distribution
  const transactionTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    transactions.forEach(tx => {
      const type = tx.type || 'unknown';
      const count = typeMap.get(type) || 0;
      typeMap.set(type, count + 1);
    });
    
    return Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / transactions.length) * 100
      }));
  }, [transactions]);
  
  // Calculate value distribution by type
  const valueDistribution = useMemo(() => {
    const valueByType = new Map<string, number>();
    
    transactions.forEach(tx => {
      const type = tx.type || 'unknown';
      const value = parseFloat(tx.value.split(' ')[0]) || 0;
      const existingValue = valueByType.get(type) || 0;
      valueByType.set(type, existingValue + value);
    });
    
    return Array.from(valueByType.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(4))
      }));
  }, [transactions]);

  // Calculate most active periods
  const hourlyActivity = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    
    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      count,
      formattedHour: `${hour}:00`
    }));
  }, [transactions]);

  // Calculate day of week activity
  const weekdayActivity = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = Array(7).fill(0);
    
    transactions.forEach(tx => {
      const day = new Date(tx.timestamp).getDay();
      dayCounts[day]++;
    });
    
    return days.map((day, index) => ({
      day: day,
      count: dayCounts[index],
      shortDay: day.substring(0, 3)
    }));
  }, [transactions]);
  
  // Most frequent interacting addresses
  const topAddresses = useMemo(() => {
    const addressCounts = new Map<string, { address: string, count: number, lastSeen: string }>();
    
    transactions.forEach(tx => {
      // Count "from" addresses
      if (tx.from) {
        const existing = addressCounts.get(tx.from) || { address: tx.from, count: 0, lastSeen: tx.timestamp };
        addressCounts.set(tx.from, {
          address: tx.from,
          count: existing.count + 1,
          lastSeen: new Date(tx.timestamp) > new Date(existing.lastSeen) ? tx.timestamp : existing.lastSeen
        });
      }
      
      // Count "to" addresses
      if (tx.to) {
        const existing = addressCounts.get(tx.to) || { address: tx.to, count: 0, lastSeen: tx.timestamp };
        addressCounts.set(tx.to, {
          address: tx.to,
          count: existing.count + 1,
          lastSeen: new Date(tx.timestamp) > new Date(existing.lastSeen) ? tx.timestamp : existing.lastSeen
        });
      }
    });
    
    return Array.from(addressCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions]);
  
  // Value vs Gas data for scatter plot
  const valueVsGasData = useMemo(() => {
    return transactions
      .filter(tx => tx.gasUsed && tx.value)
      .map(tx => {
        const value = parseFloat(tx.value.split(' ')[0]) || 0;
        return {
          value,
          gas: tx.gasUsed || 0,
          type: tx.type || 'unknown',
          // For size of points
          impact: Math.log10(value + 1) * 10
        };
      });
  }, [transactions]);

  // Transaction radar data
  const radarData = useMemo(() => {
    const typesMap = new Map<string, { type: string, count: number, avgValue: number, totalValue: number }>();
    
    transactions.forEach(tx => {
      const txType = tx.type || 'unknown';
      const value = parseFloat(tx.value.split(' ')[0]) || 0;
      
      const existing = typesMap.get(txType) || { 
        type: txType, 
        count: 0, 
        avgValue: 0,
        totalValue: 0 
      };
      
      typesMap.set(txType, {
        type: txType,
        count: existing.count + 1,
        totalValue: existing.totalValue + value,
        avgValue: (existing.totalValue + value) / (existing.count + 1)
      });
    });
    
    return Array.from(typesMap.values())
      .filter(item => item.count > 2) // Only show types with multiple transactions
      .map(item => ({
        type: item.type,
        count: Math.min(item.count, 100), // Cap to prevent outliers
        value: Math.min(item.avgValue * 20, 100), // Scale for visualization
      }));
  }, [transactions]);
  
  // Metrics overview
  const metrics = useMemo(() => {
    let totalValue = 0;
    let inflowValue = 0;
    let outflowValue = 0;
    let avgGasPrice = 0;
    let minValue = Infinity;
    let maxValue = 0;
    let recentTxCount = 0; // Last week
    const now = new Date();
    const lastWeek = new Date(now.setDate(now.getDate() - 7));
    
    const transactionCount = transactions.length;
    
    transactions.forEach(tx => {
      const value = parseFloat(tx.value.split(' ')[0]) || 0;
      totalValue += value;
      
      if (tx.type === 'inflow') inflowValue += value;
      if (tx.type === 'outflow') outflowValue += value;
      
      if (value > maxValue) maxValue = value;
      if (value < minValue && value > 0) minValue = value;
      
      avgGasPrice += tx.gasPrice || 0;
      
      // Count recent transactions
      if (new Date(tx.timestamp) >= lastWeek) {
        recentTxCount++;
      }
    });
    
    avgGasPrice = transactions.length ? avgGasPrice / transactions.length : 0;
    if (minValue === Infinity) minValue = 0;
    
    const recentActivity = transactionCount > 0 ? 
      (recentTxCount / transactionCount) * 100 : 0;
    
    return {
      totalValue: totalValue.toFixed(4),
      inflowValue: inflowValue.toFixed(4),
      outflowValue: outflowValue.toFixed(4),
      transactionCount,
      avgGasPrice: (avgGasPrice / 1e9).toFixed(2),
      netFlow: (inflowValue - outflowValue).toFixed(4),
      isPositive: inflowValue >= outflowValue,
      maxValue: maxValue.toFixed(4),
      minValue: minValue.toFixed(4),
      recentActivity: recentActivity.toFixed(0)
    };
  }, [transactions]);
  
  // Theme colors with better palette and gradients
  const THEME = {
    primary: {
      main: '#F5B056',
      light: '#F7C887',
      dark: '#D99531'
    },
    chart: {
      area: {
        stroke: '#F5B056',
        fill: 'url(#areaGradient)'
      },
      volume: {
        stroke: '#38BDF8',
        fill: 'url(#volumeGradient)'
      },
      pie: ['#F59E0B', '#38BDF8', '#10B981', '#8B5CF6', '#EC4899', '#EF4444', '#14B8A6']
    },
    inflow: {
      main: '#10B981',
      light: '#D1FAE5',
      gradient: 'from-green-500/20 to-emerald-600/20'
    },
    outflow: {
      main: '#EF4444',
      light: '#FEE2E2',
      gradient: 'from-red-500/20 to-rose-600/20'
    },
    background: {
      card: 'bg-gradient-to-br from-gray-800/40 to-gray-900/40',
      highlight: 'bg-gradient-to-br from-amber-900/10 to-amber-800/20',
      glassOverlay: 'backdrop-blur-sm bg-black/30',
      glow: 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-500/5 before:to-transparent before:rounded-lg before:z-[-1]'
    }
  };

  // Format large numbers
  const formatNumber = (num: number, digits = 2): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(digits)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(digits)}k`;
    return num.toFixed(digits);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          {/* Fix: Use a custom style to override Shadcn UI Dialog width limitations */}
          <DialogContent 
            className="w-[95vw] max-w-[95vw] lg:max-w-[95vw] h-[90vh] 
                       bg-gradient-to-b from-gray-900 to-black 
                       border border-amber-500/20 shadow-xl shadow-amber-900/20 
                       p-0 overflow-hidden"
            style={{ maxWidth: '95vw' }} // Explicitly override any max-width constraints
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {/* Background glow effects */}
              <div className="absolute top-20 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 -right-24 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"></div>
              
              <DialogHeader className="relative px-4 sm:px-8 pt-6 w-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600"></div>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <DialogTitle className="text-xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                  Transaction Analytics Dashboard
                  </DialogTitle>
                </motion.div>
              </DialogHeader>
              
              {/* Fix: Ensure full width with proper padding */}
              <ScrollArea className="h-[80vh] md:h-[75vh] w-full px-2 sm:px-6 lg:px-8">
                <div className="w-full p-2 pb-10">
                  {/* Overview Metrics - With Animation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <DashboardCard 
                        title="Total Transactions" 
                        value={metrics.transactionCount.toString()} 
                        icon={<Activity className="h-4 w-4 text-amber-500" />}
                        onHover={() => setHoveredCard("transactions")}
                        isHovered={hoveredCard === "transactions"}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Recent activity:</span>
                          <Badge variant="outline" className="font-normal bg-amber-900/20 border-amber-800/60">
                            {metrics.recentActivity}% this week
                          </Badge>
                        </div>
                      </DashboardCard>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <DashboardCard 
                        title="Total Volume" 
                        value={`${metrics.totalValue} ETH`}
                        icon={<Coins className="h-4 w-4 text-amber-500" />}
                        onHover={() => setHoveredCard("volume")}
                        isHovered={hoveredCard === "volume"}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Range:</span>
                          <span className="text-gray-300">{metrics.minValue} - {metrics.maxValue} ETH</span>
                        </div>
                      </DashboardCard>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <DashboardCard 
                        title="Net Flow" 
                        value={`${metrics.netFlow} ETH`}
                        badge={(
                          <Badge className={metrics.isPositive ? "bg-green-900/20 text-green-400 border-green-800/50" : "bg-red-900/20 text-red-400 border-red-800/50"}>
                            {metrics.isPositive ? 'Positive' : 'Negative'}
                          </Badge>
                        )}
                        icon={metrics.isPositive ? 
                          <ArrowUp className="h-4 w-4 text-green-500" /> : 
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        }
                        colorClass={metrics.isPositive ? "from-green-900/10 to-green-800/5" : "from-red-900/10 to-red-800/5"}
                        onHover={() => setHoveredCard("flow")}
                        isHovered={hoveredCard === "flow"}
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <DashboardCard 
                        title="Avg Gas Price" 
                        value={`${metrics.avgGasPrice} Gwei`}
                        icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
                        onHover={() => setHoveredCard("gas")}
                        isHovered={hoveredCard === "gas"}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Est. total cost:</span>
                          <span className="text-gray-300">{gasData.totalGasCost.toFixed(5)} ETH</span>
                        </div>
                      </DashboardCard>
                    </motion.div>
                  </div>
                  
                  {/* Main Charts Section */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="w-full"
                  >
                    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6 w-full">
                      <div className="relative">
                        {/* Glowing tab indicator line */}
                        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 blur-sm"></div>
                        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8 bg-black/20 backdrop-blur-sm rounded-lg border border-amber-500/10 p-1">
                          {[
                            { id: 'overview', name: 'Overview', icon: <Activity className="h-4 w-4" /> },
                            { id: 'value', name: 'Value Analysis', icon: <Coins className="h-4 w-4" /> },
                            { id: 'gas', name: 'Gas Analysis', icon: <Zap className="h-4 w-4" /> },
                            { id: 'timing', name: 'Timing', icon: <Clock className="h-4 w-4" /> }
                          ].map(tab => (
                            <TabsTrigger 
                              key={tab.id} 
                              value={tab.id}
                              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500/20 data-[state=active]:to-amber-700/10 data-[state=active]:text-amber-400 data-[state=active]:shadow-[0_0_10px_rgba(245,176,86,0.2)] relative overflow-hidden group"
                            >
                              {/* Background hover effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              {tab.icon}
                              {tab.name}
                              {activeTab === tab.id && (
                                <motion.div
                                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500"
                                  layoutId="activeTab"
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                              )}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                      
                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-6 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          <ChartCard 
                            title="Transaction Activity"
                            icon={<Activity className="h-5 w-5 mr-2 text-amber-500" />}
                            className="w-full"
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#F5B056" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#F5B056" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                  <XAxis dataKey="formattedDate" stroke="#999" />
                                  <YAxis stroke="#999" />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    labelStyle={{ color: '#F5B056' }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#F5B056" 
                                    strokeWidth={3}
                                    fill="url(#areaGradient)"
                                    animationDuration={1500}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          {/* Fix: Apply width consistently to all chart containers */}
                          <ChartCard 
                            title="Transaction Types"
                            icon={<PieChart className="h-5 w-5 mr-2 text-amber-500" />}
                            className="w-full"
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie
                                    data={transactionTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    animationDuration={1000}
                                  >
                                    {transactionTypeData.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={THEME.chart.pie[index % THEME.chart.pie.length]} 
                                        stroke="rgba(0,0,0,0.3)"
                                        strokeWidth={1}
                                      />
                                    ))}
                                  </Pie>
                                  <Legend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                  />
                                  <Tooltip 
                                    formatter={(value) => [`${value} transactions`, 'Count']}
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      color: '#FFFFFF'
                                    }}
                                    itemStyle={{ color: '#FFFFFF' }}
                                    labelStyle={{ color: '#F5B056' }}
                                  />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                        </div>
                        
                        {/* Transaction Impact Chart */}
                        <ChartCard 
                          title="Transaction Radar Analysis"
                          icon={<BarChart2 className="h-5 w-5 mr-2 text-amber-500" />}
                          className="w-full"
                        >
                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#444" />
                                <PolarAngleAxis dataKey="type" tick={{ fill: '#999' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" />
                                <Radar
                                  name="Transaction Count"
                                  dataKey="count"
                                  stroke="#F5B056"
                                  fill="#F5B056"
                                  fillOpacity={0.6}
                                />
                                <Radar
                                  name="Avg Value"
                                  dataKey="value"
                                  stroke="#38BDF8"
                                  fill="#38BDF8"
                                  fillOpacity={0.3}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                    borderColor: '#F5B056',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                  }}
                                />
                                <Legend />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartCard>
                      </TabsContent>
                      
                      {/* Value Analysis Tab */}
                      <TabsContent value="value" className="space-y-6 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          <ChartCard 
                            title="Volume Over Time"
                            icon={<Coins className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                  <XAxis dataKey="formattedDate" stroke="#999" />
                                  <YAxis stroke="#999" />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#38BDF8',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(value: any) => [`${value.toFixed(4)} ETH`, 'Volume']}
                                    labelStyle={{ color: '#38BDF8' }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="volume" 
                                    stroke="#38BDF8" 
                                    strokeWidth={3}
                                    fill="url(#volumeGradient)"
                                    animationDuration={1500}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Value Distribution by Type"
                            icon={<BarChart2 className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={valueDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                  <XAxis dataKey="name" stroke="#999" />
                                  <YAxis stroke="#999" />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(value: any) => [`${value} ETH`, 'Total']}
                                  />
                                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {valueDistribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={THEME.chart.pie[index % THEME.chart.pie.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Value vs Gas Correlation"
                            icon={<Activity className="h-5 w-5 mr-2 text-amber-500" />}
                            // This will span the full width on large screens
                            className="col-span-1 lg:col-span-2"
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                  <XAxis 
                                    type="number" 
                                    dataKey="value" 
                                    name="Value" 
                                    stroke="#999" 
                                    label={{ value: "ETH Value", position: "bottom", fill: "#999" }} 
                                  />
                                  <YAxis 
                                    type="number" 
                                    dataKey="gas" 
                                    name="Gas" 
                                    stroke="#999"
                                    label={{ value: "Gas Used", angle: -90, position: "insideLeft", fill: "#999" }} 
                                    scale="log" 
                                    domain={['auto', 'auto']}
                                  />
                                  <ZAxis type="number" dataKey="impact" range={[10, 50]} />
                                  <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(value: any, name: any) => {
                                      return name === 'Value' ? [`${value} ETH`, name] : [`${value}`, name];
                                    }}
                                  />
                                  <Legend />
                                  {/* Group by type for better visualization */}
                                  {['inflow', 'outflow', 'swap', 'transfer'].map((type, index) => (
                                    <Scatter 
                                      key={type}
                                      name={type.charAt(0).toUpperCase() + type.slice(1)}
                                      data={valueVsGasData.filter(item => item.type === type)}
                                      fill={THEME.chart.pie[index % THEME.chart.pie.length]}
                                    />
                                  ))}
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Inflow vs Outflow"
                            icon={<ArrowUp className="h-5 w-5 mr-2 text-amber-500" />}
                            className="col-span-1 lg:col-span-2"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-gradient-to-br from-green-900/10 to-green-900/5 p-6 rounded-xl border border-green-500/10 flex flex-col items-center">
                                <ArrowDown className="h-12 w-12 text-green-400 mb-2" />
                                <h3 className="text-lg font-medium text-green-400">Total Inflow</h3>
                                <p className="text-3xl font-bold text-green-400 mt-2">{metrics.inflowValue} ETH</p>
                                <div className="w-full mt-4 bg-black/30 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                                    style={{ 
                                      width: `${Math.min(100, (parseFloat(metrics.inflowValue) / parseFloat(metrics.totalValue)) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <p className="text-sm text-green-300/60 mt-2">
                                  {((parseFloat(metrics.inflowValue) / parseFloat(metrics.totalValue)) * 100).toFixed(1)}% of total volume
                                </p>
                              </div>
                              
                              <div className="bg-gradient-to-br from-red-900/10 to-red-900/5 p-6 rounded-xl border border-red-500/10 flex flex-col items-center">
                                <ArrowUp className="h-12 w-12 text-red-400 mb-2" />
                                <h3 className="text-lg font-medium text-red-400">Total Outflow</h3>
                                <p className="text-3xl font-bold text-red-400 mt-2">{metrics.outflowValue} ETH</p>
                                <div className="w-full mt-4 bg-black/30 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full"
                                    style={{ 
                                      width: `${Math.min(100, (parseFloat(metrics.outflowValue) / parseFloat(metrics.totalValue)) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <p className="text-sm text-red-300/60 mt-2">
                                  {((parseFloat(metrics.outflowValue) / parseFloat(metrics.totalValue)) * 100).toFixed(1)}% of total volume
                                </p>
                              </div>
                            </div>
                          </ChartCard>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="gas" className="space-y-6 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          <ChartCard 
                            title="Gas Used by Transaction Type"
                            icon={<Zap className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gasData.gasPerType} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                  <XAxis dataKey="type" stroke="#999" />
                                  <YAxis stroke="#999" />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(value: any) => [`${(value / 1e6).toFixed(2)}M units`, 'Gas Used']}
                                  />
                                  <Legend />
                                  <Bar dataKey="gasUsed" fill="#FFBB28" name="Gas Used" radius={[4, 4, 0, 0]}>
                                    {gasData.gasPerType.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={THEME.chart.pie[(index + 2) % THEME.chart.pie.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Gas Statistics"
                            icon={<Activity className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="space-y-6">
                              {/* Gas Stats Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-amber-900/10 to-amber-900/5 p-4 rounded-lg border border-amber-500/10">
                                  <div className="font-medium text-gray-400 mb-1">Total Gas Used</div>
                                  <div className="text-xl font-semibold text-amber-400">
                                    {formatNumber(gasData.totalGasUsed / 1e6, 2)}M units
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-amber-900/10 to-amber-900/5 p-4 rounded-lg border border-amber-500/10">
                                  <div className="font-medium text-gray-400 mb-1">Estimated Gas Cost</div>
                                  <div className="text-xl font-semibold text-amber-400">
                                    {gasData.totalGasCost.toFixed(6)} ETH
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-amber-900/10 to-amber-900/5 p-4 rounded-lg border border-amber-500/10">
                                  <div className="font-medium text-gray-400 mb-1">Avg Gas / Transaction</div>
                                  <div className="text-xl font-semibold text-amber-400">
                                    {transactions.length ? 
                                      formatNumber(gasData.totalGasUsed / transactions.length, 0) : 
                                      "0"} units
                                  </div>
                                </div>
                              </div>
                              
                              {/* Visualization of gas costs */}
                              <div className="p-4 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg border border-amber-500/10">
                                <h4 className="text-sm font-medium text-amber-400 mb-4">Gas Cost Distribution</h4>
                                <div className="relative pt-1">
                                  <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-black/30">
                                    {gasData.gasPerType.map((item, index) => (
                                      <div
                                        key={index}
                                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center`}
                                        style={{ 
                                          width: `${(item.gasUsed / gasData.totalGasUsed) * 100}%`,
                                          backgroundColor: THEME.chart.pie[(index + 2) % THEME.chart.pie.length]
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-400 px-2">
                                    {gasData.gasPerType.slice(0, 3).map((item, index) => (
                                      <span key={index} className="flex items-center">
                                        <span 
                                          className="w-2 h-2 rounded-full mr-1"
                                          style={{ backgroundColor: THEME.chart.pie[(index + 2) % THEME.chart.pie.length] }}
                                        />
                                        {item.type} ({((item.gasUsed / gasData.totalGasUsed) * 100).toFixed(1)}%)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Gas Price Trends */}
                              <div className="p-4 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg border border-amber-500/10">
                                <h4 className="text-sm font-medium text-amber-400 mb-2">Gas Price Info</h4>
                                <div className="mt-2 flex items-center">
                                  <div className="text-3xl font-bold text-amber-400">
                                    {parseFloat(metrics.avgGasPrice) > 0 ? metrics.avgGasPrice : "0.01"}
                                  </div>
                                  <div className="ml-2 text-sm text-gray-400">Gwei average</div>
                                </div>
                                <div className="mt-2 text-xs text-gray-400">
                                  Higher gas prices typically result in faster transaction confirmations.
                                </div>
                              </div>
                            </div>
                          </ChartCard>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="timing" className="space-y-6 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          <ChartCard 
                            title="Hourly Activity Pattern"
                            icon={<Clock className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyActivity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                  <XAxis dataKey="formattedHour" stroke="#999" />
                                  <YAxis stroke="#999" />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(value: any) => [`${value} transactions`, 'Count']}
                                  />
                                  <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]}>
                                    {hourlyActivity.map((entry, index) => {
                                      // Color by time of day: morning, afternoon, evening, night
                                      const hour = parseInt(entry.hour);
                                      let color = '#38BDF8'; // Default blue
                                      if (hour >= 6 && hour < 12) color = '#F59E0B'; // Morning: amber
                                      else if (hour >= 12 && hour < 18) color = '#10B981'; // Afternoon: green
                                      else if (hour >= 18 && hour < 22) color = '#8B5CF6'; // Evening: purple
                                      else color = '#6B7280'; // Night: gray
                                      
                                      return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Day of Week Activity"
                            icon={<Calendar className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekdayActivity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                  <XAxis dataKey="shortDay" stroke="#999" />
                                  <YAxis stroke="#999" />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                      borderColor: '#F5B056',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(value: any) => [`${value} transactions`, 'Count']}
                                  />
                                  <Bar dataKey="count" fill="#EC4899" radius={[4, 4, 0, 0]}>
                                    {weekdayActivity.map((entry, index) => {
                                      // Weekend vs weekday colors
                                      const isWeekend = index === 0 || index === 6;
                                      return <Cell key={`cell-${index}`} fill={isWeekend ? '#F59E0B' : '#8B5CF6'} />;
                                    })}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Frequent Interactions"
                            icon={<RefreshCcw className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            <div className="space-y-4">
                              {topAddresses.map((item, index) => (
                                <div key={index} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-3 rounded-lg border border-amber-500/10 flex items-center justify-between">
                                  <div>
                                    <div className="font-mono text-xs text-amber-400">
                                      {item.address.slice(0, 6)}...{item.address.slice(-4)}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      Last seen {formatDistanceToNow(new Date(item.lastSeen))} ago
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-400">
                                    {item.count} interactions
                                  </Badge>
                                </div>
                              ))}
                              
                              {topAddresses.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                  No frequent interactions found
                                </div>
                              )}
                            </div>
                          </ChartCard>
                          
                          <ChartCard 
                            title="Time Since Last Activity"
                            icon={<Clock className="h-5 w-5 mr-2 text-amber-500" />}
                          >
                            {transactions.length > 0 && (
                              <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-5xl font-bold text-amber-400 mb-2">
                                  {formatDistanceToNow(new Date(transactions[0].timestamp))}
                                </div>
                                <div className="text-gray-400">since last transaction</div>
                                <div className="mt-4 text-sm text-gray-500">
                                  Last activity on {new Date(transactions[0].timestamp).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                
                                <div className="w-full mt-6 bg-gray-800 rounded-full h-1.5">
                                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                                <div className="w-full flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Now</span>
                                  <span>First transaction</span>
                                </div>
                              </div>
                            )}
                            
                            {transactions.length === 0 && (
                              <div className="text-center py-8 text-gray-400">
                                No transaction data available
                              </div>
                            )}
                          </ChartCard>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                  
                  <div className="text-center text-xs text-gray-500 mt-10">
                    Analysis based on {transactions.length} transactions • Data is shown for informational purposes only
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}