export interface SimParams {
  /** Number of primary security stations (default = 2, range: 1-10) */
  numStations: number;
  
  /** Arrival rate in travelers per minute (default = 10) */
  arrivalRate: number;
  
  /** Primary screening mean time in seconds (default = 30) */
  mu1: number;
  
  /** Primary screening standard deviation in seconds (default = 10) */
  sigma1: number;
  
  /** Additional screening mean time in seconds (default = 120) */
  mu2: number;
  
  /** Additional screening standard deviation in seconds (default = 120) */
  sigma2: number;
  
  /** Probability of requiring additional screening (default = 0.03) */
  screenProb: number;
  
  /** Total simulation time in seconds (default = 3600) */
  simulationTime: number;
}

export interface TimeSeriesPoint {
  /** Time in seconds from start of simulation */
  time: number;
  /** Queue length at each primary station */
  queueLengths: number[];
  /** Queue length at senior officer station */
  seniorQueueLength: number;
  /** Total queue length across all stations */
  totalQueueLength: number;
}

export interface WaitingTimeDistribution {
  /** Bin edges for the histogram in seconds */
  bins: number[];
  /** Count of travelers in each bin */
  counts: number[];
}

export interface SimResults {
  /** Time series data collected during simulation */
  timeSeries: TimeSeriesPoint[];
  /** Average time travelers wait before starting service */
  avgWaitingTime: number;
  /** Maximum queue length observed during simulation */
  maxQueueLength: number;
  /** Average utilization across all primary stations */
  utilization: number;
  /** Average queue length across all stations */
  avgQueueLength: number;
  /** Average total time spent in system (waiting + service) */
  avgSystemTime: number;
  /** Distribution of waiting times */
  waitingTimeDistribution: WaitingTimeDistribution;
  /** Utilization of each primary station */
  perStationUtilization: number[];
  /** Utilization of senior officer station */
  seniorUtilization: number;
}

export interface TheoreticalResults {
  /** Theoretical utilization rate */
  utilization: number;
  /** Theoretical average queue length */
  avgQueueLength: number;
  /** Theoretical average waiting time */
  avgWaitTime: number;
  /** Theoretical average system time */
  avgSystemTime: number;
}
