import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCompactCurrency } from '@/lib/constants';

export default function AgingChart({ claims }) {
  const buckets = [
    { name: '0-14d', min: 0, max: 14 },
    { name: '15-30d', min: 15, max: 30 },
    { name: '31-60d', min: 31, max: 60 },
    { name: '61-90d', min: 61, max: 90 },
    { name: '91-120d', min: 91, max: 120 },
    { name: '120d+', min: 121, max: Infinity },
  ];

  const now = new Date();
  const data = buckets.map(bucket => {
    let totalBalance = 0;
    let count = 0;
    (claims || []).forEach(c => {
      if (!c.dos) return;
      const dos = new Date(c.dos);
      const days = Math.floor((now - dos) / (1000 * 60 * 60 * 24));
      if (days >= bucket.min && days <= bucket.max) {
        totalBalance += (c.balance || 0);
        count++;
      }
    });
    return { name: bucket.name, balance: totalBalance, count };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">AR Aging</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} tickFormatter={formatCompactCurrency} />
              <Tooltip
                formatter={(value) => [formatCompactCurrency(value), 'Balance']}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)', fontSize: '12px' }}
              />
              <Bar dataKey="balance" fill="hsl(199 89% 32%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}