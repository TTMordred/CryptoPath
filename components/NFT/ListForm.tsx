import { useState, FormEvent } from 'react';

export default function ListForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (price: string) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');

    // Validate price
    if (!price) {
      setError('Please enter a price');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      setError('Please enter a valid number');
      return;
    }

    if (numPrice <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (numPrice > 1000000) {
      setError('Price cannot exceed 1,000,000 PATH');
      return;
    }

    // Submit if validation passes
    onSubmit(price);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="number"
          step="0.0001"
          min="0"
          max="1000000"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setError(''); // Clear error when input changes
          }}
          placeholder="Enter price in PATH"
          className={`w-full p-2 bg-gray-700 rounded text-sm ${
            error ? 'border border-red-500' : ''
          }`}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-sm py-2 rounded"
        >
          List NFT
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-sm py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}