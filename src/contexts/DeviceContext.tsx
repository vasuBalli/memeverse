// import { createContext, useContext, useEffect, useState } from 'react';
// import { getDeviceId } from '../components/utils/deviceId';

// const DeviceIdContext = createContext<string | null>(null);

// export const useDeviceId = () => useContext(DeviceIdContext);

// export function DeviceIdProvider({ children }: { children: React.ReactNode }) {
//   const [deviceId, setDeviceId] = useState<string | null>(null);

//   useEffect(() => {
//     const id = getDeviceId();
//     setDeviceId(id);
//   }, []);

//   if (!deviceId) return null; // ⛔ prevent rendering before ready

//   return (
//     <DeviceIdContext.Provider value={deviceId}>
//       {children}
//     </DeviceIdContext.Provider>
//   );
// }


import { createContext, useContext, useEffect, useState } from 'react';
import { getDeviceId } from '../components/utils/deviceId';

type DeviceContextType = {
  deviceId: string | null;
  isNewDevice: boolean;
};

const DeviceContext = createContext<DeviceContextType>({
  deviceId: null,
  isNewDevice: false,
});

export const useDevice = () => useContext(DeviceContext);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isNewDevice, setIsNewDevice] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('device_id');

    if (!stored) {
      const id = `dev_${crypto.randomUUID()}`;
      localStorage.setItem('device_id', id);

      setDeviceId(id);
      setIsNewDevice(true); // ✅ FIRST TIME
    } else {
      setDeviceId(stored);
      setIsNewDevice(false); // ✅ RETURNING USER
    }
  }, []);

  if (!deviceId) return null; // ⛔ block rendering until ready

  return (
    <DeviceContext.Provider value={{ deviceId, isNewDevice }}>
      {children}
    </DeviceContext.Provider>
  );
}



