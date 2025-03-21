// components/Swap/RateInfo.tsx
import React from 'react';

interface RateInfoProps {
  rate: string;
}

const RateInfo: React.FC<RateInfoProps> = ({ rate }) => {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-gray-400">
        <span>Rate</span>
        <span>{rate}</span>
      </div>
    </div>
  );
};

export default RateInfo;