import { useNotification } from '../utils/NotificationContext';
import { useNavigate } from 'react-router-dom';

const GlobalNotifications = () => {
  const { notifications, removeNotification } = useNotification();
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'new': return '🔔';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'new': return 'from-green-500 to-green-600';
      case 'success': return 'from-blue-500 to-blue-600';
      case 'warning': return 'from-yellow-500 to-yellow-600';
      case 'error': return 'from-red-500 to-red-600';
      case 'info': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handleAction = (notification) => {
    if (notification.action?.link) {
      navigate(notification.action.link);
      removeNotification(notification.id);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-gradient-to-r ${getColor(notification.type)} text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-white border-opacity-20 animate-slide-in pointer-events-auto`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span className="text-3xl flex-shrink-0">{getIcon(notification.type)}</span>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <p className="font-bold text-lg mb-1 leading-tight">
                {notification.title}
              </p>
              
              {/* Message */}
              <p className="text-sm opacity-95 leading-snug">
                {notification.message}
              </p>
              
              {/* Metadata (Distance, Match Score) */}
              {notification.metadata?.distance && notification.metadata?.matchScore && (
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-white bg-opacity-20 rounded px-2 py-1 inline-block">
                    📍 {notification.metadata.distance.toFixed(1)} km
                  </span>
                  <span className="text-xs bg-white bg-opacity-20 rounded px-2 py-1 inline-block">
                    ⭐ {notification.metadata.matchScore}% match
                  </span>
                </div>
              )}
              
              {/* OTP Display (for receiver when donor accepts) */}
              {notification.metadata?.otp && (
                <div className="mt-3 bg-white bg-opacity-30 rounded-lg px-4 py-3">
                  <p className="text-xs opacity-80 mb-1">Confirmation Code:</p>
                  <p className="font-mono font-bold text-2xl tracking-wider text-center">
                    {notification.metadata.otp}
                  </p>
                  <p className="text-xs opacity-80 mt-1 text-center">
                    Share this with the donor
                  </p>
                </div>
              )}
              
              {/* Action Button */}
              {notification.action && (
                <button
                  onClick={() => handleAction(notification)}
                  className="mt-3 w-full bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
                >
                  {notification.action.text} →
                </button>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white hover:text-gray-200 text-2xl font-bold leading-none flex-shrink-0 transition-transform hover:scale-110"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar (optional) */}
          <div className="mt-3 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white bg-opacity-50 animate-progress"
              style={{
                animation: `progress ${notification.duration || 5000}ms linear forwards`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalNotifications;