'use client';

export default function FrameworkStatus({ frameworkStatus }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Smart Tasks Implementation Status
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Progress on the 5 key tasks for CBA Consult IT Management Framework
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Object.entries(frameworkStatus).map(([key, task]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {task.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
              <span className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${
                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {task.status.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
