'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: 'Jan', revenue2024: 15, revenue2023: -15 },
  { month: 'Feb', revenue2024: 5, revenue2023: -18 },
  { month: 'Mar', revenue2024: 12, revenue2023: -10 },
  { month: 'Apr', revenue2024: 25, revenue2023: -15 },
  { month: 'May', revenue2024: 15, revenue2023: -5 },
  { month: 'Jun', revenue2024: 10, revenue2023: -17 },
  { month: 'Jul', revenue2024: 7, revenue2023: -15 },
  { month: 'Aug', revenue2024: 15, revenue2023: -5 },
  { month: 'Sep', revenue2024: 10, revenue2023: -17 },
  { month: 'Oct', revenue2024: 7, revenue2023: -15 },
  { month: 'Nov', revenue2024: 15, revenue2023: -5 },
  { month: 'Dec', revenue2024: 20, revenue2023: -17 },
];

export default function RevenueGraph() {
  return (
    <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-300">Total Revenue</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-400">2024</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-sm text-gray-400">2023</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="month" 
                stroke="#666" 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue2024"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="revenue2023"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ fill: '#22d3ee', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 