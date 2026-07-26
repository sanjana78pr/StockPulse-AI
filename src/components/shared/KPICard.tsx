import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export default function KPICard({ title, value, change, prefix = '', suffix = '', icon }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-5 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">
          {prefix}{value}{suffix}
        </span>
      </div>
      
      {change !== undefined && (
        <div className={cn("flex items-center mt-2 text-sm font-medium", isPositive ? "text-market-up" : "text-market-down")}>
          {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {Math.abs(change)}%
        </div>
      )}
    </motion.div>
  );
}
