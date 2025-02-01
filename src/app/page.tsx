"use client"

import { useState, ChangeEvent, FormEvent } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { runSimulation } from '../../lib/simulation';
import { calculateTheoretical, TheoreticalResultsPanel } from '../components/TheoreticalResults';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SimParams {
  numStations: number;
  arrivalRate: number;
  mu1: number;
  sigma1: number;
  mu2: number;
  sigma2: number;
  screenProb: number;
  simulationTime: number;
}

interface SimResults {
  timeSeries: Array<{
    time: number;
    queueLengths: number[];
    seniorQueueLength: number;
    totalQueueLength: number;
  }>;
  avgWaitingTime: number;
  maxQueueLength: number;
  utilization: number;
  avgQueueLength: number;
  avgSystemTime: number;
  waitingTimeDistribution: {
    bins: number[];
    counts: number[];
  };
  perStationUtilization: number[];
  seniorUtilization: number;
}

interface TheoreticalResults {
  utilization: number;
  avgQueueLength: number;
  avgWaitTime: number;
  avgSystemTime: number;
}

export default function Home() {
  const defaultParams: SimParams = {
    numStations: 2,
    arrivalRate: 10,
    mu1: 30,
    sigma1: 10,
    mu2: 120,
    sigma2: 120,
    screenProb: 0.03,
    simulationTime: 3600,
  };

  const [params, setParams] = useState<SimParams>(defaultParams);

  const [results, setResults] = useState<SimResults | null>(null);
  const [theoretical, setTheoretical] = useState<TheoreticalResults | null>(null);

  const handleParamChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  const handleRunSimulation = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const simulationResults = runSimulation(params);
    const theoreticalResults = calculateTheoretical(params);
    setResults(simulationResults);
    setTheoretical(theoreticalResults);
  };

  const handleReset = () => {
    setParams(defaultParams);
  };

  const chartData = {
    labels: results ? results.timeSeries.map(t => t.time.toFixed(1)) : [],
    datasets: [
      {
        label: 'Total Queue Length',
        data: results ? results.timeSeries.map(t => t.totalQueueLength) : [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      ...results ? results.timeSeries[0].queueLengths.map((_, index) => ({
        label: `Station ${index + 1} Queue`,
        data: results.timeSeries.map(t => t.queueLengths[index]),
        borderColor: `hsl(${(index * 360) / results.timeSeries[0].queueLengths.length}, 70%, 50%)`,
        tension: 0.1,
        hidden: true,
      })) : [],
      {
        label: 'Senior Queue',
        data: results ? results.timeSeries.map(t => t.seniorQueueLength) : [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        hidden: true,
      },
    ],
  };

  const waitingTimeHistogramData = results ? {
    labels: results.waitingTimeDistribution.bins.map(b => b.toFixed(1) + 's'),
    datasets: [{
      label: 'Waiting Time Distribution',
      data: results.waitingTimeDistribution.counts,
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1,
    }],
  } : null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Airport Security Queue Simulation</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Parameters */}
        <div className="col-span-4">
          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div className="space-y-6">
              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Number of Stations: {params.numStations}</span>
                  <input type="range" name="numStations" value={params.numStations}
                    onChange={handleParamChange} min="1" max="10" step="1"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Arrival Rate: {params.arrivalRate}/min</span>
                  <input type="range" name="arrivalRate" value={params.arrivalRate}
                    onChange={handleParamChange} min="1" max="120" step="1"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1/min</span>
                  <span>120/min</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Primary Service Mean: {params.mu1}s</span>
                  <input type="range" name="mu1" value={params.mu1}
                    onChange={handleParamChange} min="5" max="120" step="1"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>5s</span>
                  <span>120s</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Primary Service Std Dev: {params.sigma1}s</span>
                  <input type="range" name="sigma1" value={params.sigma1}
                    onChange={handleParamChange} min="1" max="30" step="1"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1s</span>
                  <span>30s</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Senior Service Mean: {params.mu2}s</span>
                  <input type="range" name="mu2" value={params.mu2}
                    onChange={handleParamChange} min="10" max="300" step="1"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>10s</span>
                  <span>300s</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Senior Service Std Dev: {params.sigma2}s</span>
                  <input type="range" name="sigma2" value={params.sigma2}
                    onChange={handleParamChange} min="1" max="60" step="1"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1s</span>
                  <span>60s</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Screening Probability: {(params.screenProb * 100).toFixed(1)}%</span>
                  <input type="range" name="screenProb" value={params.screenProb}
                    onChange={handleParamChange} min="0" max="0.5" step="0.01"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-gray-700">Simulation Time: {params.simulationTime}s</span>
                  <input type="range" name="simulationTime" value={params.simulationTime}
                    onChange={handleParamChange} min="60" max="3600" step="60"
                    className="mt-1 block w-full"
                  />
                </label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1min</span>
                  <span>1hr</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Run Simulation
              </button>
              <button type="button" onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Results */}
        <div className="col-span-8">
          {results && theoretical ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Queue Length Over Time</h3>
                <Line data={chartData} options={{ 
                  responsive: true,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Queue Lengths Over Time'
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Queue Length'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Time (seconds)'
                      }
                    }
                  }
                }} />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Waiting Time Distribution</h3>
                {waitingTimeHistogramData && (
                  <Bar data={waitingTimeHistogramData} options={{
                    responsive: true,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Distribution of Waiting Times'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Travelers'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Waiting Time (seconds)'
                        }
                      }
                    }
                  }} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Simulation Results</h3>
                  <div className="space-y-2">
                    <p>Average Waiting Time: {results.avgWaitingTime.toFixed(2)}s</p>
                    <p>Maximum Queue Length: {results.maxQueueLength}</p>
                    <p>Average Queue Length: {results.avgQueueLength.toFixed(2)}</p>
                    <p>Average System Time: {results.avgSystemTime.toFixed(2)}s</p>
                    <div className="mt-4">
                      <p className="font-semibold">Station Utilization:</p>
                      {results.perStationUtilization.map((util, i) => (
                        <p key={i}>Station {i + 1}: {(util * 100).toFixed(1)}%</p>
                      ))}
                      <p>Senior Officer: {(results.seniorUtilization * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <TheoreticalResultsPanel theoretical={theoretical} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Run the simulation to see results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}