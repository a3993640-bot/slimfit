
import { RouteType } from "./types";

export const calculateBMI = (weight: number, heightCm: number) => {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  return parseFloat(bmi.toFixed(1));
};

export const getBMIStatus = (bmi: number) => {
  if (bmi < 18.5) return { label: "偏瘦", color: "text-blue-400" };
  if (bmi < 24.9) return { label: "正常", color: "text-mint-400" };
  if (bmi < 29.9) return { label: "超重", color: "text-yellow-400" };
  return { label: "肥胖", color: "text-coral-400" };
};

export const calculateDailyTarget = (
  startWeight: number,
  targetWeight: number,
  startDate: string,
  currentDate: string,
  route: RouteType,
  totalDays: number
): number => {
  // Normalize dates to midnight to ignore time differences
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  
  // Safety check for invalid dates
  if (isNaN(start.getTime()) || isNaN(current.getTime())) return startWeight;

  const diffTime = current.getTime() - start.getTime();
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (daysPassed <= 0) return startWeight; // Day 0 or before
  if (daysPassed >= totalDays) return targetWeight;

  const totalLoss = startWeight - targetWeight;
  // Prevent division by zero
  const safeTotalDays = totalDays > 0 ? totalDays : 1;
  const lossPerDay = totalLoss / safeTotalDays;
  
  const currentTarget = startWeight - (lossPerDay * daysPassed);
  
  return parseFloat(currentTarget.toFixed(2));
};

export const formatDate = (date: Date) => {
  // Use local time YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatChartDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const getDaysPassed = (startDate: string) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  
  // Reset time part to ensure strict day calculation (Midnight to Midnight)
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime())) return 0;
  
  const diffTime = now.getTime() - start.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return days < 0 ? 0 : days;
};

// Image Compression Utility
export const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    // If input is invalid, return empty
    if (!base64Str) {
        resolve('');
        return;
    }
    // If not an image data url, just return it (e.g. emoji)
    if (!base64Str.startsWith('data:image')) {
        resolve(base64Str);
        return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
          resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback
  });
};

export const generateId = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 for clarity
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
