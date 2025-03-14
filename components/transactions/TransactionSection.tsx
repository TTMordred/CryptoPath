'use client';

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkTransactionTable from './NetworkTransactionTable';
import { CoinOption } from "@/services/cryptoService";
import { motion } from "framer-motion";

interface TransactionSectionProps {
  selectedCoin: CoinOption | null;
}

export default function TransactionSection({ selectedCoin }: TransactionSectionProps) {
  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800/95 border-gray-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Transaction History
        </CardTitle>
      </CardHeader>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NetworkTransactionTable selectedCoin={selectedCoin} />
      </motion.div>
    </Card>
  );
} 