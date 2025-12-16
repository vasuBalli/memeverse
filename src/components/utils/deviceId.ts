// utils/deviceId.ts
import { v4 as uuidv4 } from 'uuid';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');

  if (!deviceId) {
    deviceId = `dev_${crypto.randomUUID()}`;
    localStorage.setItem('device_id', deviceId);
    document.cookie = `device_id=${deviceId}; path=/; max-age=31536000`;
  }

  return deviceId;
}


// export function getDeviceId(): {
//   id: string;
//   isNew: boolean;
// } {
//   let deviceId = localStorage.getItem('device_id');

//   if (!deviceId) {
//     deviceId = `dev_${crypto.randomUUID()}`;
//     localStorage.setItem('device_id', deviceId);

//     return { id: deviceId, isNew: true };
//   }

//   return { id: deviceId, isNew: false };
// }
