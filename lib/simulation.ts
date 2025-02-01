interface SimulationParams {
  numStations: number;
  arrivalRate: number;  // per minute
  mu1: number;         // seconds
  sigma1: number;      // seconds
  mu2: number;         // seconds
  sigma2: number;      // seconds
  screenProb: number;
  simulationTime: number; // seconds
}

interface Traveler {
  arrivalTime: number;
  needsScreening: boolean;
  startServiceTime?: number;
  endServiceTime?: number;
}

interface Station {
  busy: boolean;
  remainingTime: number;
  traveler: Traveler | null;
  queue: Traveler[];
}

interface TimeSeriesPoint {
  time: number;
  queueLengths: number[];  // One per primary station
  seniorQueueLength: number;
  totalQueueLength: number;
}

interface WaitingTimeDistribution {
  bins: number[];
  counts: number[];
}

interface SimulationResult {
  timeSeries: TimeSeriesPoint[];
  avgWaitingTime: number;
  maxQueueLength: number;
  utilization: number;
  avgQueueLength: number;
  avgSystemTime: number;
  waitingTimeDistribution: WaitingTimeDistribution;
  perStationUtilization: number[];
  seniorUtilization: number;
}

const truncatedNormal = (mu: number, sigma: number): number => {
  let value: number;
  do {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    value = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    value = mu + sigma * value;
  } while (value < 0);  // Changed minimum to 0 as per requirements
  return value;
};

const calculateWaitingTimeDistribution = (waitingTimes: number[]): WaitingTimeDistribution => {
  const numBins = 20;
  const max = Math.max(...waitingTimes);
  const binSize = max / numBins;
  const bins = Array.from({length: numBins}, (_, i) => i * binSize);
  const counts = new Array(numBins).fill(0);
  
  waitingTimes.forEach(time => {
    const binIndex = Math.min(Math.floor(time / binSize), numBins - 1);
    counts[binIndex]++;
  });
  
  return { bins, counts };
};

export const runSimulation = (params: SimulationParams): SimulationResult => {
  const {
    numStations,
    arrivalRate,
    mu1,
    sigma1,
    mu2,
    sigma2,
    screenProb,
    simulationTime,
  } = params;

  const stepSize = 0.1;  // 100ms steps for more accurate simulation
  const totalSteps = Math.ceil(simulationTime / stepSize);
  const arrivalRatePerSecond = arrivalRate / 60;  // Convert from per minute to per second

  // Initialize stations with separate queues
  let primaryStations: Station[] = Array(numStations)
    .fill(null)
    .map(() => ({
      busy: false,
      remainingTime: 0,
      traveler: null,
      queue: [],
    }));

  let seniorStation: Station = { 
    busy: false, 
    remainingTime: 0, 
    traveler: null, 
    queue: [] 
  };

  let timeSeries: TimeSeriesPoint[] = [];
  let waitingTimes: number[] = [];
  let primaryServiceTimes: number[] = [];
  let seniorServiceTimes: number[] = [];
  let stationBusyTime = new Array(numStations).fill(0);
  let seniorBusyTime = 0;

  let timeToNextArrival = -Math.log(Math.random()) / arrivalRatePerSecond;

  for (let step = 0; step < totalSteps; step++) {
    const currentTime = step * stepSize;

    // Handle arrivals
    timeToNextArrival -= stepSize;
    if (timeToNextArrival <= 0) {
      // Find shortest queue
      const shortestQueueIndex = primaryStations
        .map((s, i) => ({ length: s.queue.length, index: i }))
        .reduce((min, curr) => curr.length < min.length ? curr : min)
        .index;

      primaryStations[shortestQueueIndex].queue.push({
        arrivalTime: currentTime,
        needsScreening: Math.random() < screenProb,
      });

      // Schedule next arrival
      timeToNextArrival = -Math.log(Math.random()) / arrivalRatePerSecond;
    }

    // Process primary stations
    primaryStations.forEach((station, index) => {
      if (station.busy) {
        station.remainingTime -= stepSize;
        stationBusyTime[index] += stepSize;

        if (station.remainingTime <= 0) {
          if (station.traveler?.needsScreening) {
            seniorStation.queue.push(station.traveler);
          }
          station.busy = false;
          station.traveler = null;
        }
      }

      if (!station.busy && station.queue.length > 0) {
        const traveler = station.queue.shift()!;
        const serviceTime = truncatedNormal(mu1, sigma1);
        station.busy = true;
        station.remainingTime = serviceTime;
        station.traveler = {
          ...traveler,
          startServiceTime: currentTime,
        };
        waitingTimes.push(currentTime - traveler.arrivalTime);
        primaryServiceTimes.push(serviceTime);
      }
    });

    // Process senior station
    if (seniorStation.busy) {
      seniorStation.remainingTime -= stepSize;
      seniorBusyTime += stepSize;

      if (seniorStation.remainingTime <= 0) {
        seniorStation.busy = false;
        seniorStation.traveler = null;
      }
    }

    if (!seniorStation.busy && seniorStation.queue.length > 0) {
      const traveler = seniorStation.queue.shift()!;
      const serviceTime = truncatedNormal(mu2, sigma2);
      seniorStation.busy = true;
      seniorStation.remainingTime = serviceTime;
      seniorStation.traveler = traveler;
      seniorServiceTimes.push(serviceTime);
    }

    // Record time series data
    const queueLengths = primaryStations.map(s => s.queue.length);
    const totalQueueLength = queueLengths.reduce((a, b) => a + b, 0) + seniorStation.queue.length;

    timeSeries.push({
      time: currentTime,
      queueLengths,
      seniorQueueLength: seniorStation.queue.length,
      totalQueueLength,
    });
  }

  const avgWaitingTime = waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length || 0;
  const maxQueueLength = Math.max(...timeSeries.map(t => t.totalQueueLength));
  const avgQueueLength = timeSeries.reduce((sum, point) => sum + point.totalQueueLength, 0) / timeSeries.length;
  const perStationUtilization = stationBusyTime.map(time => time / simulationTime);
  const seniorUtilization = seniorBusyTime / simulationTime;

  return {
    timeSeries,
    avgWaitingTime,
    maxQueueLength,
    utilization: perStationUtilization.reduce((a, b) => a + b, 0) / numStations,
    avgQueueLength,
    avgSystemTime: avgWaitingTime + 
      (primaryServiceTimes.reduce((a, b) => a + b, 0) / primaryServiceTimes.length || 0) +
      (seniorServiceTimes.length > 0 ? seniorServiceTimes.reduce((a, b) => a + b, 0) / seniorServiceTimes.length : 0),
    waitingTimeDistribution: calculateWaitingTimeDistribution(waitingTimes),
    perStationUtilization,
    seniorUtilization,
  };
};