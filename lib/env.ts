import getConfig from 'next/config';

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

export const getEnvVar = (key: string): string => {
  // Ưu tiên server config trước
  const value = serverRuntimeConfig[key] || publicRuntimeConfig[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not defined`);
    return '';
  }
  return value;
};

export const ETHERSCAN_API_KEY = getEnvVar('ETHERSCAN_API_KEY');
export const ETHERSCAN_API_URL = "https://api.etherscan.io/api";