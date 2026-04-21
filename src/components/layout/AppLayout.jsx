import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn('transition-[margin] duration-300 ease-in-out', collapsed ? 'ml-16' : 'ml-60')}>
        <TopBar user={user} />
        <main className="p-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}