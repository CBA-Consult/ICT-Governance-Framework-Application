'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  ArrowsPointingOutIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

export default function InteractiveCharts({ 
  data, 
  chartType = 'line', 
  title, 
  onDataPointClick,
  enableZoom = true,
  enableFilter = true,
  height = 400 
}) {
  const [filteredData, setFilteredData] = useState(data || []);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [zoomDomain, setZoomDomain] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (data) {
      setFilteredData(data);
      // Auto-select first few metrics if available
      const metrics = Object.keys(data[0] || {}).filter(key => 
        key !== 'date' && key !== 'timestamp' && key !== 'name' && typeof data[0][key] === 'number'
      );
      setSelectedMetrics(metrics.slice(0, 3));
    }
  }, [data]);

  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
    if (start && end && data) {
      const filtered = data.filter(item => {
        const itemDate = new Date(item.date || item.timestamp);
        return itemDate >= new Date(start) && itemDate <= new Date(end);
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(data || []);
    }
  };

  const handleDataPointClick = (data, index) => {
    if (onDataPointClick) {
      onDataPointClick(data, index);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600">
          <p className="font-medium">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      onClick: handleDataPointClick
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {enableZoom && <Brush dataKey="date" height={30} stroke="#3B82F6" />}
            {selectedMetrics.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                name={metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {enableZoom && <Brush dataKey="date" height={30} stroke="#3B82F6" />}
            {selectedMetrics.map((metric, index) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
                name={metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metric, index) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={COLORS[index % COLORS.length]}
                name={metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {enableZoom && <Brush dataKey="date" height={30} stroke="#3B82F6" />}
            {selectedMetrics.slice(0, 2).map((metric, index) => (
              <Bar
                key={`bar-${metric}`}
                dataKey={metric}
                fill={COLORS[index % COLORS.length]}
                name={metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
            {selectedMetrics.slice(2, 4).map((metric, index) => (
              <Line
                key={`line-${metric}`}
                type="monotone"
                dataKey={metric}
                stroke={COLORS[(index + 2) % COLORS.length]}
                strokeWidth={2}
                name={metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
          </ComposedChart>
        );

      case 'pie':
        const pieData = selectedMetrics.map((metric, index) => ({
          name: metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: filteredData.reduce((sum, item) => sum + (item[metric] || 0), 0),
          fill: COLORS[index % COLORS.length]
        }));
        
        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey={selectedMetrics[0]} stroke="#6b7280" />
            <YAxis dataKey={selectedMetrics[1]} stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Data Points"
              data={filteredData}
              fill="#3B82F6"
            />
          </ScatterChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const availableMetrics = data && data.length > 0 
    ? Object.keys(data[0]).filter(key => 
        key !== 'date' && key !== 'timestamp' && key !== 'name' && typeof data[0][key] === 'number'
      )
    : [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${
      isFullscreen ? 'fixed inset-0 z-50 m-4' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || 'Interactive Chart'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {enableFilter && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Toggle Fullscreen"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      {enableFilter && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FunnelIcon className="h-4 w-4 inline mr-1" />
                Metrics
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableMetrics.map(metric => (
                  <label key={metric} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={() => handleMetricToggle(metric)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) => handleDateRangeChange(e.target.value, dateRange.end)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                />
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) => handleDateRangeChange(dateRange.start, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chart Type
              </label>
              <select
                value={chartType}
                onChange={(e) => {
                  // This would need to be passed up to parent component
                  console.log('Chart type changed to:', e.target.value);
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="composed">Composed Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        {filteredData && filteredData.length > 0 ? (
          <div style={{ width: '100%', height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
            <ResponsiveContainer>
              {renderChart()}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available for the selected criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      {filteredData && filteredData.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {filteredData.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Metrics:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {selectedMetrics.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Date Range:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {filteredData.length > 0 ? `${filteredData[0].date} - ${filteredData[filteredData.length - 1].date}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}