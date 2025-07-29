import { useEffect } from 'react';
import toast from 'react-hot-toast';

let deferredPrompt: any;

const PWASetup = () => {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallPrompt();
    };

    const handleAppInstalled = () => {
      toast.success('App installed successfully!');
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
      
        })
        .catch((registrationError) => {
      
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstallPrompt = () => {
    if (deferredPrompt) {
      toast.custom(
        (t) => (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📱</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold">Install Neurativo</h4>
                <p className="text-white/70 text-sm">Get the full app experience</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                      if (choiceResult.outcome === 'accepted') {
                    
                      }
                      deferredPrompt = null;
                    });
                    toast.dismiss(t.id);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Install
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ),
        {
          duration: 8000,
          position: 'bottom-center',
        }
      );
    }
  };

  return null;
};

export default PWASetup;