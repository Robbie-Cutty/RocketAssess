import React from 'react';
import { FaChartLine, FaUsers, FaClock, FaTrophy, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const AnalyticsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendDirection = 'up',
  color = 'blue',
  className = '' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const getIcon = (iconName) => {
    const icons = {
      chart: FaChartLine,
      users: FaUsers,
      clock: FaClock,
      trophy: FaTrophy,
      check: FaCheckCircle,
      times: FaTimesCircle
    };
    return icons[iconName] || FaChartLine;
  };

  const IconComponent = getIcon(icon);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trendColors[trendDirection]}`}>
              <span className="font-medium">{trend}</span>
              {trendDirection === 'up' && <span className="ml-1">↗</span>}
              {trendDirection === 'down' && <span className="ml-1">↘</span>}
              {trendDirection === 'neutral' && <span className="ml-1">→</span>}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <IconComponent size={24} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCard; 