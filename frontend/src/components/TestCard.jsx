import React from 'react';
import { FaClock, FaBook, FaUsers, FaCalendar, FaPlay } from 'react-icons/fa';

const TestCard = ({ 
  test, 
  onClick, 
  onInvite, 
  onViewResults,
  showActions = true,
  className = '' 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-800',
      'Science': 'bg-green-100 text-green-800',
      'English': 'bg-purple-100 text-purple-800',
      'History': 'bg-yellow-100 text-yellow-800',
      'Geography': 'bg-indigo-100 text-indigo-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[subject] || colors.default;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {test.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(test.subject)}`}>
            {test.subject}
          </span>
        </div>
        
        {test.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {test.description}
          </p>
        )}

        {/* Test Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <FaCalendar className="text-gray-400" />
            <span>{formatDate(test.created_at)}</span>
          </div>
          {test.duration_minutes && (
            <div className="flex items-center space-x-1">
              <FaClock className="text-gray-400" />
              <span>{test.duration_minutes} min</span>
            </div>
          )}
          {test.point_value && (
            <div className="flex items-center space-x-1">
              <FaBook className="text-gray-400" />
              <span>{test.point_value} pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-4 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick && onClick(test);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
            >
              <FaPlay size={12} />
              <span>View</span>
            </button>
            
            {onInvite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInvite(test);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <FaUsers size={12} />
                <span>Invite</span>
              </button>
            )}
            
            {onViewResults && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResults(test);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <FaBook size={12} />
                <span>Results</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCard;
