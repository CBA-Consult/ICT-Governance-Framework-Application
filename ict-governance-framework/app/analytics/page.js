'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon, BeakerIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState([]);
  const [analysisResults, setAnalysisResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState('predictive');
  const [analysisParams, setAnalysisParams] = useState({
    metric_name: '',
    time_range: {
      start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    fetchAvailableMetrics();
  }, []);

  const fetchAvailableMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:4000/api/data-collection/metrics?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const result = await response.json();
      
      // Get unique metric names
      const uniqueMetrics = [...new Set(result.data.metrics.map(m => m.metric_name))];
      setMetrics(uniqueMetrics);
      
      if (uniqueMetrics.length > 0 && !analysisParams.metric_name) {
        setAnalysisParams(prev => ({ ...prev, metric_name: uniqueMetrics[0] }));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const runAnalysis = async (analysisType) => {
    if (!analysisParams.metric_name) {
      alert('Please select a metric');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let body = {
        metric_name: analysisParams.metric_name,
        time_range: {
          start_date: new Date(analysisParams.time_range.start_date).toISOString(),
          end_date: new Date(analysisParams.time_range.end_date).toISOString()
        }
      };

      switch (analysisType) {
        case 'predictive':
          endpoint = '/api/data-analytics/predictive-analysis';
          body.prediction_period = 30;
          break;
        case 'anomaly':
          endpoint = '/api/data-analytics/anomaly-detection';
          body.sensitivity_level = 2;
          break;
        case 'benchmark':
          endpoint = '/api/data-analytics/benchmark-analysis';
          body.benchmark_type = 'historical';
          break;
        default:
          throw new Error('Unknown analysis type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to run ${analysisType} analysis`);
      }

      const result = await response.json();
      setAnalysisResults(prev => ({
        ...prev,
        [analysisType]: result.data
      }));
    } catch (err) {
      console.error(`Error running ${analysisType} analysis:`, err);
      alert(`Failed to run ${analysisType} analysis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runCorrelationAnalysis = async () => {
    if (metrics.length < 2) {
      alert('Need at least 2 metrics for correlation analysis');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const metric1 = metrics[0];
      const metric2 = metrics[1];

      const response = await fetch('/api/data-analytics/correlation-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metric1,
          metric2,
          time_range: {
            start_date: new Date(analysisParams.time_range.start_date).toISOString(),
            end_date: new Date(analysisParams.time_range.end_date).toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run correlation analysis');
      }

      const result = await response.json();
      setAnalysisResults(prev => ({
        ...prev,
        correlation: result.data
      }));
    } catch (err) {
      console.error('Error running correlation analysis:', err);
      alert('Failed to run correlation analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runMultidimensionalAnalysis = async () => {
    if (metrics.length < 3) {
      alert('Need at least 3 metrics for multidimensional analysis');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const selectedMetrics = metrics.slice(0, 5); // Use first 5 metrics

      const response = await fetch('/api/data-analytics/multidimensional-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: selectedMetrics,
          time_range: {
            start_date: new Date(analysisParams.time_range.start_date).toISOString(),
            end_date: new Date(analysisParams.time_range.end_date).toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run multidimensional analysis');
      }

      const result = await response.json();
      setAnalysisResults(prev => ({
        ...prev,
        multidimensional: result.data
      }));
    } catch (err) {
      console.error('Error running multidimensional analysis:', err);
      alert('Failed to run multidimensional analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const PredictiveAnalysisResults = ({ data }) => {
    if (!data?.analysis_result) return null;

    const result = data.analysis_result;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-600" />
          Predictive Analysis: {data.metric_name}
        </h3>
        
        {result.predictions ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Model Type:</span>
                <p className="font-medium">{result.model_type}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                <p className="font-medium">{(result.confidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Trend Slope:</span>
                <p className="font-medium">{result.trend_slope?.toFixed(4)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Data Points:</span>
                <p className="font-medium">{result.data_points_used}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Next 7 Days Predictions:</h4>
              <div className="space-y-2">
                {result.predictions.slice(0, 7).map((prediction, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm">{new Date(prediction.date).toLocaleDateString()}</span>
                    <span className="font-medium">{prediction.predicted_value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{result.message}</p>
        )}
      </div>
    );
  };

  const AnomalyDetectionResults = ({ data }) => {
    if (!data?.analysis_result) return null;

    const result = data.analysis_result;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
          Anomaly Detection: {data.metric_name}
        </h3>
        
        {result.anomalies ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Anomalies:</span>
                <p className="font-medium">{result.statistics.anomaly_count}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Anomaly Rate:</span>
                <p className="font-medium">{result.statistics.anomaly_percentage.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Mean Value:</span>
                <p className="font-medium">{result.statistics.mean.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Std Deviation:</span>
                <p className="font-medium">{result.statistics.standard_deviation.toFixed(2)}</p>
              </div>
            </div>
            
            {result.anomalies.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Anomalies:</h4>
                <div className="space-y-2">
                  {result.anomalies.slice(0, 5).map((anomaly, index) => (
                    <div key={index} className={`p-3 rounded border-l-4 ${
                      anomaly.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{new Date(anomaly.timestamp).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm">Value: {anomaly.value.toFixed(2)}</span>
                        <span className="text-sm ml-4">Z-Score: {anomaly.z_score.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{result.message}</p>
        )}
      </div>
    );
  };

  const BenchmarkAnalysisResults = ({ data }) => {
    if (!data?.analysis_result) return null;

    const result = data.analysis_result;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
          Benchmark Analysis: {data.metric_name}
        </h3>
        
        {result.current_period ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Benchmark Type:</span>
                <p className="font-medium">{result.benchmark_type}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Performance Status:</span>
                <p className={`font-medium ${
                  result.performance_status === 'improved' ? 'text-green-600' :
                  result.performance_status === 'declined' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {result.performance_status}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Current Period</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Average:</span>
                    <span className="font-medium">{result.current_period.average.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Maximum:</span>
                    <span className="font-medium">{result.current_period.maximum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Minimum:</span>
                    <span className="font-medium">{result.current_period.minimum.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Benchmark Period</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Average:</span>
                    <span className="font-medium">{result.benchmark_period.average.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Maximum:</span>
                    <span className="font-medium">{result.benchmark_period.maximum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Minimum:</span>
                    <span className="font-medium">{result.benchmark_period.minimum.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {result.improvement_percentage !== undefined && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Improvement:</span>
                  <span className={`font-bold ${
                    result.improvement_percentage > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.improvement_percentage > 0 ? '+' : ''}{result.improvement_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{result.message}</p>
        )}
      </div>
    );
  };

  if (loading && Object.keys(analysisResults).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Advanced Data Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Perform advanced analytics on governance metrics
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        )}

        {/* Analysis Controls */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Analysis Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Metric</label>
              <select
                value={analysisParams.metric_name}
                onChange={(e) => setAnalysisParams(prev => ({ ...prev, metric_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="">Select a metric</option>
                {metrics.map(metric => (
                  <option key={metric} value={metric}>{metric}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={analysisParams.time_range.start_date}
                onChange={(e) => setAnalysisParams(prev => ({
                  ...prev,
                  time_range: { ...prev.time_range, start_date: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={analysisParams.time_range.end_date}
                onChange={(e) => setAnalysisParams(prev => ({
                  ...prev,
                  time_range: { ...prev.time_range, end_date: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runAnalysis('predictive')}
              disabled={loading || !analysisParams.metric_name}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
              Predictive Analysis
            </button>
            
            <button
              onClick={() => runAnalysis('anomaly')}
              disabled={loading || !analysisParams.metric_name}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Anomaly Detection
            </button>
            
            <button
              onClick={() => runAnalysis('benchmark')}
              disabled={loading || !analysisParams.metric_name}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Benchmark Analysis
            </button>
            
            <button
              onClick={runCorrelationAnalysis}
              disabled={loading || metrics.length < 2}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <BeakerIcon className="h-4 w-4 mr-2" />
              Correlation Analysis
            </button>
            
            <button
              onClick={runMultidimensionalAnalysis}
              disabled={loading || metrics.length < 3}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <BeakerIcon className="h-4 w-4 mr-2" />
              Multidimensional Analysis
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-6">
          {analysisResults.predictive && (
            <PredictiveAnalysisResults data={analysisResults.predictive} />
          )}
          
          {analysisResults.anomaly && (
            <AnomalyDetectionResults data={analysisResults.anomaly} />
          )}
          
          {analysisResults.benchmark && (
            <BenchmarkAnalysisResults data={analysisResults.benchmark} />
          )}
          
          {analysisResults.correlation && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Correlation Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Correlation Coefficient:</span>
                  <p className="font-medium">{analysisResults.correlation.analysis_result.correlation_coefficient?.toFixed(3)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Strength:</span>
                  <p className="font-medium">{analysisResults.correlation.analysis_result.strength}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Direction:</span>
                  <p className="font-medium">{analysisResults.correlation.analysis_result.direction}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Data Points:</span>
                  <p className="font-medium">{analysisResults.correlation.analysis_result.data_points}</p>
                </div>
              </div>
            </div>
          )}
          
          {analysisResults.multidimensional && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Multidimensional Analysis</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Metrics Analyzed:</span>
                  <p className="font-medium">{analysisResults.multidimensional.analysis_result.metrics_analyzed?.join(', ')}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Data Points:</span>
                  <p className="font-medium">{analysisResults.multidimensional.analysis_result.total_data_points}</p>
                </div>
                {analysisResults.multidimensional.analysis_result.summary_statistics && (
                  <div>
                    <h4 className="font-medium mb-2">Summary Statistics:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analysisResults.multidimensional.analysis_result.summary_statistics).map(([metric, stats]) => (
                        <div key={metric} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <h5 className="font-medium text-sm mb-2">{metric}</h5>
                          <div className="text-xs space-y-1">
                            <div>Mean: {stats.mean?.toFixed(2)}</div>
                            <div>Min: {stats.min?.toFixed(2)}</div>
                            <div>Max: {stats.max?.toFixed(2)}</div>
                            <div>Count: {stats.count}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {Object.keys(analysisResults).length === 0 && (
          <div className="text-center py-12">
            <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No analysis results yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Select a metric and run an analysis to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}