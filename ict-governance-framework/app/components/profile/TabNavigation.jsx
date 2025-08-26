import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';

const TabNavigation = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList 
            className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-0 bg-transparent"
            role="tablist"
            aria-label="Profile navigation tabs"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className="flex items-center space-x-2 py-4 px-6 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-gray-500 hover:text-gray-700 transition-colors"
              >
                {tab.icon && <tab.icon className="w-4 h-4" aria-hidden="true" />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default TabNavigation;