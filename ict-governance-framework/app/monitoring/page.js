// File: ict-governance-framework/app/monitoring/page.js
// Monitoring page for the ICT Governance Framework

'use client';

import React from 'react';
import MonitoringDashboard from '../components/monitoring/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MonitoringDashboard />
    </div>
  );
}