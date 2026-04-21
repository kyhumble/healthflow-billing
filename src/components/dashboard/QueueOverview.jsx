import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QUEUE_CONFIG } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export default function QueueOverview({ claims }) {
  const queueCounts = {};
  Object.keys(QUEUE_CONFIG).forEach(q => { queueCounts[q] = 0; });
  (claims || []).forEach(c => {
    const q = c.queue_name || 'unassigned';
    queueCounts[q] = (queueCounts[q] || 0) + 1;
  });

  const queues = Object.entries(QUEUE_CONFIG)
    .map(([key, config]) => ({ key, ...config, count: queueCounts[key] || 0 }))
    .filter(q => q.key !== 'unassigned' || q.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Queue Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {queues.map(q => {
          const maxCount = Math.max(...queues.map(x => x.count), 1);
          const pct = (q.count / maxCount) * 100;
          return (
            <Link
              key={q.key}
              to={`/claims?queue=${q.key}`}
              className="flex items-center gap-3 group py-1.5 cursor-pointer"
            >
              <div className="w-28 text-xs font-medium text-muted-foreground truncate group-hover:text-foreground transition-colors">
                {q.label}
              </div>
              <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                <div
                  className={cn(`h-full rounded-md bg-${q.color}-100 transition-all duration-500`)}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <div className="w-10 text-right text-sm font-semibold font-tabular">{q.count}</div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}