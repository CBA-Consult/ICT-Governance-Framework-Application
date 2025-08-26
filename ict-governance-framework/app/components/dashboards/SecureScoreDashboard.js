'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/solid';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { useCountUp } from '../../hooks/useCountUp';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981'
};

const MetricCard = ({ title, value, icon: Icon, unit = '', trend, color = 'blue' }) => {
  const animatedValue = useCountUp(value, 2);
  
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    purple: 'text-purple-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transform hover:-translate-y-1 transition-all duration-300 ease-in-out hover:shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} aria-hidden="true" />
        </div>
        <div className="text-right">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {animatedValue}{unit}
          </dd>
          {trend && (
            <div className="flex items-center justify-end mt-2">
              {trend.direction === 'improving' ? (
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : trend.direction === 'declining' ? (
                <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-sm ${
                trend.direction === 'improving' ? 'text-green-600' : 
                trend.direction === 'declining' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend.change > 0 ? '+' : ''}{trend.change}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ recommendation, onViewDetails }) => {
  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const impactIcons = {
    Low: CheckCircleIcon,
    Moderate: InformationCircleIcon,
    High: ExclamationTriangleIcon
  };

  const ImpactIcon = impactIcons[recommendation.userImpact] || InformationCircleIcon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
            {recommendation.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {recommendation.category}
          </p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[recommendation.priority]}`}>
          {recommendation.priority}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ImpactIcon className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {recommendation.userImpact} Impact
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Score: {recommendation.impactScore}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Cost: {recommendation.implementationCost}
        </span>
        <button
          onClick={() => onViewDetails(recommendation)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

const ControlCategoryChart = ({ categories }) => {
  const data = categories.map(category => ({
    name: category.name,
    implemented: category.implementedControls,
    total: category.totalControls,
    rate: category.implementationRate
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
          <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
          <Tooltip
            formatter={(value, name) => [
              name === 'rate' ? `${value}%` : value,
              name === 'rate' ? 'Implementation Rate' : name === 'implemented' ? 'Implemented' : 'Total'
            ]}
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              borderColor: '#4b5563',
              color: '#ffffff',
              borderRadius: '0.5rem',
            }}
          />
          <Bar dataKey="rate" name="Implementation Rate" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const SecureScoreGauge = ({ currentScore, maxScore }) => {
  const percentage = Math.round((currentScore / maxScore) * 100);
  const data = [
    {
      name: 'Score',
      value: percentage,
      fill: percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444'
    }
  ];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: 200, height: 200 }}>
        <ResponsiveContainer>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data}>
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={data[0].fill}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {currentScore}/{maxScore}
        </div>
        <div className="text-lg font-semibold" style={{ color: data[0].fill }}>
          {percentage}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Secure Score
        </div>
      </div>
    </div>
  );
};

export default function SecureScoreDashboard({ timeRange = 30 }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

  useEffect(() => {
    fetchSecureScoreDashboard();
  }, [timeRange]);

  const fetchSecureScoreDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/secure-scores/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch secure score dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching secure score dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecommendationDetails = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowRecommendationModal(true);
  };

  const handleSyncSecureScores = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/secure-scores/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh dashboard data after sync
        await fetchSecureScoreDashboard();
      }
    } catch (err) {
      console.error('Error syncing secure scores:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error loading secure score dashboard: {error}</p>
        <button 
          onClick={fetchSecureScoreDashboard}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No secure score data available</p>
        <button 
          onClick={handleSyncSecureScores}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sync Data
        </button>
      </div>
    );
  }

  const {
    overview,
    trends,
    controlCategories,
    topRecommendations = [],
    riskAreas = [],
    complianceImpact = []
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Microsoft Secure Score Dashboard
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {new Date(overview.lastUpdated).toLocaleString()}
          </span>
          <button
            onClick={handleSyncSecureScores}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sync Now
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Score"
          value={overview.currentScore}
          icon={ShieldCheckIcon}
          unit={`/${overview.maxScore}`}
          trend={overview.trend}
          color="blue"
        />
        <MetricCard
          title="Score Percentage"
          value={overview.percentage}
          icon={ChartBarIcon}
          unit="%"
          trend={overview.trend}
          color={overview.percentage >= 80 ? 'green' : overview.percentage >= 60 ? 'yellow' : 'red'}
        />
        <MetricCard
          title="Risk Areas"
          value={riskAreas.length}
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <MetricCard
          title="Top Recommendations"
          value={topRecommendations.length}
          icon={ClockIcon}
          color="purple"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Secure Score Gauge */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Secure Score
          </h3>
          <SecureScoreGauge 
            currentScore={overview.currentScore} 
            maxScore={overview.maxScore} 
          />
        </div>

        {/* Score Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Score Trends ({timeRange} days)
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    borderColor: '#4b5563',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Score Percentage"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Current Score"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Control Categories and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Categories Implementation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Control Categories Implementation
          </h3>
          <ControlCategoryChart categories={controlCategories} />
        </div>

        {/* Top Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Recommendations
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {topRecommendations.map((recommendation, index) => (
              <RecommendationCard
                key={index}
                recommendation={recommendation}
                onViewDetails={handleViewRecommendationDetails}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Risk Areas and Compliance Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Areas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Areas
          </h3>
          <div className="space-y-3">
            {riskAreas.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    risk.riskLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {risk.area}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {risk.recommendation}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {risk.implementationRate}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Impact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Compliance Framework Impact
          </h3>
          <div className="space-y-3">
            {complianceImpact.map((framework, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {framework.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {framework.implementedControls}/{framework.totalControls} controls
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    framework.score >= 80 ? 'text-green-600' : 
                    framework.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {framework.score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation Details Modal */}
      {showRecommendationModal && selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recommendation Details
              </h3>
              <button
                onClick={() => setShowRecommendationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedRecommendation.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedRecommendation.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Priority:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    PRIORITY_COLORS[selectedRecommendation.priority]
                  }`}>
                    {selectedRecommendation.priority}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Impact Score:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {selectedRecommendation.impactScore}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Implementation Cost:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {selectedRecommendation.implementationCost}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">User Impact:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {selectedRecommendation.userImpact}
                  </span>
                </div>
              </div>
              
              {selectedRecommendation.complianceFrameworks && selectedRecommendation.complianceFrameworks.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Compliance Frameworks:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedRecommendation.complianceFrameworks.map((framework, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {framework}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-500">Recommended Action:</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedRecommendation.action}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}