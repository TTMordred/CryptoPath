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
    <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold text-white">
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