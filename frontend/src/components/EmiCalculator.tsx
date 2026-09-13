'use client';

import React, { useState } from 'react';
import { Calculator, Percent, Calendar, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

interface EmiCalculatorProps {
  carPrice: number;
  carTitle?: string;
  regNumber?: string;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({
  carPrice,
  carTitle = 'Selected Vehicle',
  regNumber = '',
}) => {
  // Down payment percentage (default 20%)
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  // Loan tenure in years (default 5 years / 60 months)
  const [tenureYears, setTenureYears] = useState(5);
  // Annual interest rate (default 9.5%)
  const [interestRate, setInterestRate] = useState(9.5);

  const downPaymentAmount = Math.round((carPrice * downPaymentPercent) / 100);
  const loanPrincipal = Math.max(0, carPrice - downPaymentAmount);

  // Monthly EMI Calculation Formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
  const totalMonths = tenureYears * 12;
  const monthlyInterestRate = interestRate / 12 / 100;

  let monthlyEmi = 0;
  if (loanPrincipal > 0 && monthlyInterestRate > 0 && totalMonths > 0) {
    const factor = Math.pow(1 + monthlyInterestRate, totalMonths);
    monthlyEmi = Math.round((loanPrincipal * monthlyInterestRate * factor) / (factor - 1));
  }

  const totalAmountPayable = monthlyEmi * totalMonths;
  const totalInterestPayable = Math.max(0, totalAmountPayable - loanPrincipal);

  const handleApplyLoanWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello Value Cars, I would like to apply for auto financing / loan for ${carTitle} (${regNumber}) priced at ₹${(carPrice / 100000).toFixed(2)} Lakh. My proposed down payment is ₹${(downPaymentAmount / 100000).toFixed(2)} Lakh with a ${tenureYears}-year tenure.`
    );
    window.open(`https://wa.me/918050966025?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Interactive EMI Calculator
            </h3>
            <p className="text-[11px] text-slate-500">Calculate instant monthly installments</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          Instant Approval
        </span>
      </div>

      {/* Primary Result Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-inner flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
            Estimated Monthly EMI
          </span>
          <div className="text-3xl font-black text-amber-400 mt-0.5">
            ₹{monthlyEmi.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-bold text-slate-300">/ month</span>
          </div>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="text-slate-400">
            Loan Amount: <strong className="text-white">₹{(loanPrincipal / 100000).toFixed(2)} Lakh</strong>
          </p>
          <p className="text-slate-400">
            Total Interest: <strong className="text-slate-200">₹{(totalInterestPayable / 100000).toFixed(2)} L</strong>
          </p>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4 text-xs font-semibold text-slate-700">
        {/* Down Payment Slider */}
        <div>
          <div className="flex justify-between mb-1">
            <span>Down Payment ({downPaymentPercent}%)</span>
            <span className="font-bold text-slate-900">
              ₹{(downPaymentAmount / 100000).toFixed(2)} Lakh
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>10% (Min)</span>
            <span>35%</span>
            <span>60% (Max)</span>
          </div>
        </div>

        {/* Loan Duration Slider */}
        <div>
          <div className="flex justify-between mb-1">
            <span>Loan Duration ({tenureYears} Years / {totalMonths} Mos)</span>
            <span className="font-bold text-slate-900">{tenureYears} Years</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>1 Year</span>
            <span>3 Years</span>
            <span>5 Years</span>
            <span>7 Years</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div>
          <div className="flex justify-between mb-1">
            <span>Annual Interest Rate ({interestRate}% p.a.)</span>
            <span className="font-bold text-slate-900">{interestRate}%</span>
          </div>
          <input
            type="range"
            min="8.0"
            max="15.0"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>8.0% (Prime)</span>
            <span>11.5%</span>
            <span>15.0%</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleApplyLoanWhatsApp}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Pre-Approve Loan via WhatsApp</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
