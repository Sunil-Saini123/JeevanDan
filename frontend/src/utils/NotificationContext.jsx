import { createContext, useContext, useState, useEffect } from 'react';
import socketService from './socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user, userType } = useAuth();

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = { 
      ...notification, 
      id,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Listen to socket events for donors
  useEffect(() => {
    if (!user || userType !== 'donor') return;

    const handleNewRequest = (data) => {
      console.log('🔔 New blood request received:', data);
      
      addNotification({
        type: 'new',
        title: 'New Blood Request!',
        message: `${data.urgency?.toUpperCase()} request: ${data.bloodGroup} blood needed at ${data.hospital || 'nearby hospital'}`,
        action: { 
          text: 'View Request', 
          link: '/donor/requests' 
        },
        metadata: {
          distance: data.distance,
          matchScore: data.matchScore,
          urgency: data.urgency
        },
        duration: 8000
      });
    };

    const handleDonationStarted = (data) => {
      console.log('✅ Donation started:', data);
      
      addNotification({
        type: 'info',
        title: 'Donation Started',
        message: data.message || 'The receiver has started the donation process',
        action: { 
          text: 'View Details', 
          link: '/donor/requests' 
        },
        duration: 5000
      });
    };

    const handleDonationCompleted = (data) => {
      console.log('🎉 Donation completed:', data);
      
      addNotification({
        type: 'success',
        title: '🎉 Donation Completed!',
        message: `${data.message || 'Thank you for saving a life!'} You've saved ${data.liveSaved || 3} lives!`,
        action: { 
          text: 'View History', 
          link: '/donor/history' 
        },
        duration: 10000
      });
    };

    socketService.on('newBloodRequest', handleNewRequest);
    socketService.on('donationStarted', handleDonationStarted);
    socketService.on('donationCompleted', handleDonationCompleted);

    return () => {
      socketService.off('newBloodRequest', handleNewRequest);
      socketService.off('donationStarted', handleDonationStarted);
      socketService.off('donationCompleted', handleDonationCompleted);
    };
  }, [user, userType]);

  // Listen to socket events for receivers
  useEffect(() => {
    if (!user || userType !== 'receiver') return;

    const handleDonorAccepted = (data) => {
      console.log('✅ Donor accepted:', data);
      
      addNotification({
        type: 'success',
        title: 'Donor Accepted!',
        message: `${data.donor?.fullName || 'A donor'} (${data.donor?.bloodGroup || 'matching blood group'}) accepted your request`,
        action: { 
          text: 'View Donors', 
          link: `/receiver/request/${data.requestId}/donors`  // ✅ CHANGED to match route
        },
        metadata: {
          donorName: data.donor?.fullName,
          donorBloodGroup: data.donor?.bloodGroup
        },
        duration: 12000 // Longer duration for OTP
      });
    };

    const handleDonorRejected = (data) => {
      console.log('❌ Donor rejected:', data);
      
      addNotification({
        type: 'warning',
        title: 'Finding Alternative',
        message: data.message || 'A donor rejected your request. Finding alternatives...',
        action: { 
          text: 'View Status', 
          link: '/receiver/my-requests' 
        },
        duration: 6000
      });
    };

    socketService.on('donorAccepted', handleDonorAccepted);
    socketService.on('donorRejected', handleDonorRejected);

    return () => {
      socketService.off('donorAccepted', handleDonorAccepted);
      socketService.off('donorRejected', handleDonorRejected);
    };
  }, [user, userType]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};