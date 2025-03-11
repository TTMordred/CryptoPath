import { useState } from 'react';

export default function ListForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (price: string) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState('');

  return (
    <div className="space-y-3">
      <input
        type="number"
        step="0.0001"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Enter price in PATH"
        className="w-full p-2 bg-gray-700 rounded text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(price)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-sm py-2 rounded"
        >
          List NFT
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-sm py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}