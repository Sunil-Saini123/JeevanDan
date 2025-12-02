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
      case 'new': return 'from-purple-600 to-purple-700';      // ✅ Darker purple
      case 'success': return 'from-green-600 to-green-700';    // ✅ Darker green
      case 'warning': return 'from-orange-600 to-orange-700';  // ✅ Darker orange
      case 'error': return 'from-red-600 to-red-700';          // ✅ Darker red
      case 'info': return 'from-blue-600 to-blue-700';         // ✅ Darker blue
      default: return 'from-gray-700 to-gray-800';
    }
  };

  const handleAction = (notification) => {
    if (notification.action?.link) {
      navigate(notification.action.link);
      removeNotification(notification.id);
    }
  };

  console.log('🔔 Current notifications:', notifications); // ✅ DEBUG

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {notifications.map((notification) => {
        console.log('📋 Rendering notification:', notification); // ✅ DEBUG
        console.log('📊 Metadata:', notification.metadata); // ✅ DEBUG
        
        return (
          <div
            key={notification.id}
            className={`bg-gradient-to-r ${getColor(notification.type)} text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in pointer-events-auto backdrop-blur-sm`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <span className="text-3xl flex-shrink-0 drop-shadow-lg">{getIcon(notification.type)}</span>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <p className="font-bold text-lg mb-1 leading-tight text-white drop-shadow-md">
                  {notification.title}
                </p>
                
                {/* Message */}
                <p className="text-sm leading-snug text-white/95 drop-shadow">
                  {notification.message}
                </p>
                
                {/* ✅ FIXED: Metadata Badges with Better Contrast */}
                {(notification.metadata?.distance !== undefined || notification.metadata?.matchScore !== undefined) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {notification.metadata?.distance !== undefined && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-900 shadow-md">
                        📍 {typeof notification.metadata.distance === 'number' 
                          ? notification.metadata.distance.toFixed(1) 
                          : notification.metadata.distance} km
                      </span>
                    )}
                    
                    {notification.metadata?.matchScore !== undefined && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-900 shadow-md">
                        ⭐ {notification.metadata.matchScore}% match
                      </span>
                    )}

                    {notification.metadata?.urgency && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                        notification.metadata.urgency === 'Critical' 
                          ? 'bg-red-500 text-white' 
                          : notification.metadata.urgency === 'Urgent'
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {notification.metadata.urgency === 'Critical' && '🚨'}
                        {notification.metadata.urgency === 'Urgent' && '⚡'}
                        {notification.metadata.urgency === 'Normal' && '📋'}
                        {' '}{notification.metadata.urgency}
                      </span>
                    )}
                  </div>
                )}

                {/* ✅ FIXED: Donor Details Display (for donorAccepted) */}
                {notification.metadata?.donorName && (
                  <div className="mt-3 bg-gray-900/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <p className="text-sm text-white font-semibold">
                      👤 {notification.metadata.donorName}
                    </p>
                    {notification.metadata?.donorBloodGroup && (
                      <p className="text-xs text-white/80">
                        🩸 {notification.metadata.donorBloodGroup}
                      </p>
                    )}
                  </div>
                )}
                
                {/* ✅ FIXED: Action Button with Better Contrast */}
                {notification.action && (
                  <button
                    onClick={() => handleAction(notification)}
                    className="mt-3 w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-100 active:bg-gray-200 transition-all text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {notification.action.text} →
                  </button>
                )}
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-white/80 hover:text-white text-2xl font-bold leading-none flex-shrink-0 transition-all hover:scale-110 active:scale-95 drop-shadow-md"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
            
            {/* ✅ FIXED: Progress Bar with Better Visibility */}
            <div className="mt-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/90 shadow-lg animate-progress"
                style={{
                  animation: `progress ${notification.duration || 10000}ms linear forwards`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GlobalNotifications;