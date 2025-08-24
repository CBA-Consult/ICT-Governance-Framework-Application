// File: ict-governance-framework/app/components/monitoring/MonitoringDashboard.js
// Comprehensive monitoring dashboard for integration health and performance

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Database,
  Network,
  RefreshCw,
  Settings,
  Download,
  Filter
} from 'lucide-react';

const MonitoringDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedIntegration, setSelectedIntegration] = useState('all');

  // Fetch monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive health status
  const healthResponse = await fetch('http://localhost:4000/api/monitoring/health');
      const healthResult = await healthResponse.json();
      
      if (healthResult.success) {
        setHealthData(healthResult.data);
      }

      // Fetch metrics data
  const metricsResponse = await fetch(`http://localhost:4000/api/monitoring/metrics?timeRange=${selectedTimeRange}`);
      const metricsResult = await metricsResponse.json();
      
      if (metricsResult.success) {
        setMetricsData(metricsResult.data);
      }

      // Fetch alerts
  const alertsResponse = await fetch('http://localhost:4000/api/monitoring/alerts?status=active&limit=50');
      const alertsResult = await alertsResponse.json();
      
      if (alertsResult.success) {
        setAlertsData(alertsResult.data);
      }

      // Fetch dashboard data
  const dashboardResponse = await fetch(`http://localhost:4000/api/monitoring/dashboard?timeRange=${selectedTimeRange}`);
      const dashboardResult = await dashboardResponse.json();
      
      if (dashboardResult.success) {
        setDashboardData(dashboardResult.data);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  // Auto-refresh data
  useEffect(() => {
    fetchMonitoringData();
    
    const interval = setInterval(fetchMonitoringData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMonitoringData, refreshInterval]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format response time
  const formatResponseTime = (time) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  // Format uptime percentage
  const formatUptime = (uptime) => {
    return uptime ? `${uptime.toFixed(2)}%` : 'N/A';
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load monitoring data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integration Monitoring</h1>
          <p className="text-gray-600">
            Real-time monitoring and health status of all integrations
          </p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button onClick={fetchMonitoringData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                  <p className="text-2xl font-bold">{healthData.summary.total}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{healthData.summary.healthy}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{healthData.summary.warning}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unhealthy</p>
                  <p className="text-2xl font-bold text-red-600">{healthData.summary.unhealthy}</p>
                </div>
                <Zap className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {healthData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Healthy', value: healthData.summary.healthy, fill: '#10b981' },
                          { name: 'Warning', value: healthData.summary.warning, fill: '#f59e0b' },
                          { name: 'Unhealthy', value: healthData.summary.unhealthy, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Healthy', value: healthData.summary.healthy, fill: '#10b981' },
                          { name: 'Warning', value: healthData.summary.warning, fill: '#f59e0b' },
                          { name: 'Unhealthy', value: healthData.summary.unhealthy, fill: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Response Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.trends && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={Object.values(dashboardData.trends)[0]?.responseTime || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [formatResponseTime(value), 'Response Time']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertsData.slice(0, 5).map((alert) => (
                  <div key={alert.alert_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-600">
                          {alert.integration_name} • {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthData && Object.entries(healthData.integrations).map(([name, integration]) => (
                  <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        integration.status === 'healthy' ? 'bg-green-500' :
                        integration.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h3 className="font-medium">{name}</h3>
                        <p className="text-sm text-gray-600">
                          Priority: {integration.priority} • 
                          Last Check: {integration.lastCheck ? new Date(integration.lastCheck).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {integration.responseTime ? formatResponseTime(integration.responseTime) : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">Response Time</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatUptime(integration.uptime)}
                        </p>
                        <p className="text-xs text-gray-600">Uptime</p>
                      </div>
                      
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      
                      {integration.alerts > 0 && (
                        <Badge variant="destructive">
                          {integration.alerts} alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertsData.map((alert) => (
                  <div key={alert.alert_id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div>
                          <h4 className="font-medium">{alert.message}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Integration: {alert.integration_name} • Type: {alert.type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Availability Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.trends && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={Object.values(dashboardData.trends)[0]?.availability || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [`${value.toFixed(2)}%`, 'Availability']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {healthData && (
                  <div className="space-y-4">
                    {Object.entries(healthData.integrations).map(([name, integration]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">
                            {integration.responseTime ? formatResponseTime(integration.responseTime) : 'N/A'}
                          </span>
                          <span className="text-sm">
                            {formatUptime(integration.uptime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Network className="h-6 w-6 mb-2" />
                  <span>Connectivity Test</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Security Check</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Activity className="h-6 w-6 mb-2" />
                  <span>Performance Test</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Database className="h-6 w-6 mb-2" />
                  <span>Data Integrity</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Zap className="h-6 w-6 mb-2" />
                  <span>Circuit Breaker</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Rate Limiting</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;