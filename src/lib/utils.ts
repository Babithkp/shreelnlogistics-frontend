import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatDateTimeByAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""} ago`;
  }

  // Show actual date after a week
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getUnmatchingFields(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
) {
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  const diffs: Record<string, { obj1: any; obj2: any }> = {};

  allKeys.forEach((key) => {
    const val1 = obj1[key];
    const val2 = obj2[key];
    if (val1 !== val2) {
      diffs[key] = { obj1: val1, obj2: val2 };
    }
  });

  return diffs;
}

export function filterOnlyCompletePrimitiveDiffs(diff: Record<string, any>) {
  const cleaned: Record<string, { obj1: any; obj2: any }> = {};

  for (const key in diff) {
    const entry = diff[key];
    const isPrimitive = (val: any) => val !== null && typeof val !== "object";

    if (
      entry.obj1 !== undefined &&
      entry.obj2 !== undefined &&
      isPrimitive(entry.obj1) &&
      isPrimitive(entry.obj2)
    ) {
      cleaned[key] = {
        obj1: entry.obj1,
        obj2: entry.obj2,
      };
    }
  }
  return cleaned;
}

export function getUnmatchingFieldsWithDeepLR(
  obj1: Record<string, any>,
  obj2: Record<string, any>
) {
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  const diffs: Record<string, { obj1: any; obj2: any }> = {};

  allKeys.forEach((key) => {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (key === "lrData" && Array.isArray(val1) && Array.isArray(val2)) {
      const lr1 = val1[0];
      const lr2 = val2[0];

      if (!lr1 || !lr2) return;

      const lrKeys = new Set([...Object.keys(lr1), ...Object.keys(lr2)]);
      for (const lrKey of lrKeys) {
        if (lr1[lrKey] !== lr2[lrKey]) {
          diffs[`lrData.${lrKey}`] = {
            obj1: lr1[lrKey],
            obj2: lr2[lrKey],
          };
        }
      }
    } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
      const nestedKeys = new Set([...Object.keys(val1), ...Object.keys(val2)]);
      for (const nestedKey of nestedKeys) {
        if (val1[nestedKey] !== val2[nestedKey]) {
          diffs[`${key}.${nestedKey}`] = {
            obj1: val1[nestedKey],
            obj2: val2[nestedKey],
          };
        }
      }
    } else if (val1 !== val2) {
      diffs[key] = { obj1: val1, obj2: val2 };
    }
  });

  return diffs;
}


export const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function numberToIndianWords(amount: number): string {
  const ones: string[] = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens: string[] = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const numToWords = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    }
    if (num < 1000) {
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + numToWords(num % 100) : "")
      );
    }
    return "";
  };

  const convertIndian = (num: number): string => {
    if (num === 0) return "Zero";
    let str = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = num;

    if (crore) str += numToWords(crore) + " Crore ";
    if (lakh) str += numToWords(lakh) + " Lakh ";
    if (thousand) str += numToWords(thousand) + " Thousand ";
    if (hundred) str += numToWords(hundred);

    return str.trim();
  };

  const rupees: number = Math.floor(amount);
  const paise: number = Math.round((amount - rupees) * 100);

  let result = convertIndian(rupees) + " Rupees Only";
  if (paise > 0) {
    result += " and " + convertIndian(paise) + " Paise Only";
  }

  return result;
}