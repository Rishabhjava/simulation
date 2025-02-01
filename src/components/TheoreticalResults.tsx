import { SimParams } from '../types';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface TheoreticalResults {
  utilization: number;
  avgQueueLength: number;
  avgWaitTime: number;
  avgSystemTime: number;
}

function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

export function calculateTheoretical(params: SimParams): TheoreticalResults {
  const lambda = params.arrivalRate / 60;
  const mu = 1 / (params.mu1 / 1000);
  const c = params.numStations;
  
  const rho = lambda / (c * mu);
  
  const p0_sum = Array.from({length: c}, (_, k) => 
    (Math.pow(c * rho, k) / factorial(k)));
  const p0_final = Math.pow(c * rho, c) / (factorial(c) * (1 - rho));
  const p0 = 1 / (p0_sum.reduce((a, b) => a + b, 0) + p0_final);
  const erlangC = (Math.pow(c * rho, c) * p0) / (factorial(c) * (1 - rho));

  const Lq = erlangC * rho / (1 - rho);
  const Wq = Lq / lambda;
  const Ws = Wq + 1/mu;
  
  return {
    utilization: rho,
    avgQueueLength: Lq,
    avgWaitTime: Wq,
    avgSystemTime: Ws
  };
}

interface TheoreticalResultsProps {
  theoretical: TheoreticalResults;
}

export function TheoreticalResultsPanel({ theoretical }: TheoreticalResultsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-2">Theoretical Results (M/M/c)</h3>
      <div className="space-y-2">
        <p>Server Utilization: {(theoretical.utilization * 100).toFixed(1)}%</p>
        <p>Average Queue Length: {theoretical.avgQueueLength.toFixed(2)}</p>
        <p>Average Waiting Time: {theoretical.avgWaitTime.toFixed(2)}s</p>
        <p>Average System Time: {theoretical.avgSystemTime.toFixed(2)}s</p>
      </div>
      
      <div className="mt-4 space-y-3 text-sm text-gray-600">
        <h4 className="font-medium">M/M/c Queue Formulas:</h4>
        
        <div>
          <p className="mb-1">Traffic Intensity:</p>
          <BlockMath>{`\\rho = \\frac{\\lambda}{c\\mu}`}</BlockMath>
        </div>

        <div>
          <p className="mb-1">Erlang C Formula:</p>
          <BlockMath>{`C(c,\\rho) = \\frac{(c\\rho)^c}{c!(1-\\rho)} P_0`}</BlockMath>
          <BlockMath>{`P_0 = [\\sum_{k=0}^{c-1}\\frac{(c\\rho)^k}{k!} + \\frac{(c\\rho)^c}{c!(1-\\rho)}]^{-1}`}</BlockMath>
        </div>

        <div>
          <p className="mb-1">Performance Metrics:</p>
          <BlockMath>{`L_q = \\frac{C(c,\\rho)\\rho}{1-\\rho}`}</BlockMath>
          <BlockMath>{`W_q = \\frac{L_q}{\\lambda}`}</BlockMath>
          <BlockMath>{`W_s = W_q + \\frac{1}{\\mu}`}</BlockMath>
        </div>
      </div>
    </div>
  );
} 