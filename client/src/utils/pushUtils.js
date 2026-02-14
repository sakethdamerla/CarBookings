import api from './api';

const VAPID_PUBLIC_KEY = 'BFZC5jGiGE5K9CoTikw5_ssI-rfFgs0tahPdCADU1p1pYc5vBE3ayuGFbI7krVe88wbjfo0Xe42oDkO9xNevHwY';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeToPush = async () => {
    try {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }

        // Send to backend
        await api.post('/push/subscribe', subscription);
        console.log('Push subscription successful');
    } catch (error) {
        console.error('Push subscription failed:', error);
    }
};

export const unsubscribeFromPush = async () => {
    try {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
            console.log('Unsubscribed from push');
        }
    } catch (error) {
        console.error('Push unsubscription failed:', error);
    }
};
