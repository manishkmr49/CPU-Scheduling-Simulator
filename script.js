$(document).ready(function () {
  setTimeout(function () {
    $("#splashScreen").hide();
    $("#mainContent").show();
  }, 4000); // 4000 milliseconds
});

function solve() {
  var algorithm = document.getElementById("algorithm").value;
  var arrivalTimes = document.getElementById("arrivalTime").value.split(" ");
  var burstTimes = document.getElementById("burstTime").value.split(" ");

  if (arrivalTimes.length !== burstTimes.length) {
    alert("Number of arrival times must match number of burst times.");
    return;
  }

  var outputHTML = `
      <table>
          <tr>
              <th>Job</th>
              <th>Arrival Time</th>
              <th>Burst Time</th>
              <th>Finish Time</th>
              <th>Turnaround Time</th>
              <th>Waiting Time</th>
          </tr>
  `;

  var finishTimes = [];
  var currentTime = 0;
  var totalWaitingTime = 0;

  switch (algorithm) {
    case "FCFS":
      for (var i = 0; i < arrivalTimes.length; i++) {
        var finishTime =
          Math.max(currentTime, parseInt(arrivalTimes[i])) +
          parseInt(burstTimes[i]);
        finishTimes.push(finishTime);
        totalWaitingTime += Math.max(
          0,
          currentTime - parseInt(arrivalTimes[i])
        );
        currentTime = finishTime;
      }
      break;

    case "SJF":
      var jobs = [];
      for (var i = 0; i < arrivalTimes.length; i++) {
        jobs.push({
          index: i,
          burstTime: parseInt(burstTimes[i]),
          arrivalTime: parseInt(arrivalTimes[i]),
        });
      }
      jobs.sort((a, b) => a.arrivalTime - b.arrivalTime);

      var finishTimes = new Array(arrivalTimes.length).fill(0);
      var currentTime = 0;
      var totalWaitingTime = 0;

      while (jobs.length > 0) {
        var availableJobs = jobs.filter(
          (job) => job.arrivalTime <= currentTime
        );
        if (availableJobs.length === 0) {
          currentTime++;
          continue;
        }

        availableJobs.sort((a, b) => a.burstTime - b.burstTime);

        var shortestJob = availableJobs.shift();
        var jobIndex = shortestJob.index;

        finishTimes[jobIndex] = currentTime + shortestJob.burstTime;
        totalWaitingTime += currentTime - shortestJob.arrivalTime;
        currentTime = finishTimes[jobIndex];

        jobs = jobs.filter((job) => job.index !== jobIndex);
      }
      break;

    case "SRTF":
      var jobs = [];
      for (var i = 0; i < arrivalTimes.length; i++) {
        jobs.push({
          index: i,
          burstTime: parseInt(burstTimes[i]),
          remainingBurstTime: parseInt(burstTimes[i]),
          arrivalTime: parseInt(arrivalTimes[i]),
        });
      }
      jobs.sort((a, b) => a.arrivalTime - b.arrivalTime);

      var finishTimes = new Array(arrivalTimes.length).fill(0);
      var currentTime = 0;
      var totalWaitingTime = 0;
      var completedJobs = 0;

      while (completedJobs < arrivalTimes.length) {
        var availableJobs = jobs.filter(
          (job) => job.arrivalTime <= currentTime && job.remainingBurstTime > 0
        );
        if (availableJobs.length === 0) {
          currentTime++;
          continue;
        }

        availableJobs.sort(
          (a, b) => a.remainingBurstTime - b.remainingBurstTime
        );

        var shortestJob = availableJobs[0];
        var jobIndex = shortestJob.index;

        finishTimes[jobIndex] = currentTime + 1;
        shortestJob.remainingBurstTime--;

        if (shortestJob.remainingBurstTime === 0) {
          totalWaitingTime +=
            currentTime -
            shortestJob.arrivalTime -
            shortestJob.burstTime +
            parseInt(burstTimes[jobIndex]);
          completedJobs++;
        }

        currentTime++;
      }
      break;

    case "RR":
      var timeQuantum = prompt("Enter time quantum for Round Robin:");
      if (timeQuantum === null || timeQuantum === "") {
        alert("Time quantum cannot be empty.");
        return;
      }
      timeQuantum = parseInt(timeQuantum);
      if (isNaN(timeQuantum) || timeQuantum <= 0) {
        alert("Please enter a valid time quantum.");
        return;
      }

      var { solvedProcessesInfo, ganttChartInfo } = rr(
        arrivalTimes.map(Number),
        burstTimes.map(Number),
        timeQuantum
      );

      finishTimes = solvedProcessesInfo.map((process) => process.ft);
      totalWaitingTime = solvedProcessesInfo.reduce((acc, process) => {
        return acc + process.wat;
      }, 0);
      break;

    default:
      alert("Invalid algorithm selected.");
      return;
  }

  // Fill in the output table
  for (var i = 0; i < arrivalTimes.length; i++) {
    outputHTML += `
          <tr>
              <td>${i + 1}</td>
              <td>${arrivalTimes[i]}</td>
              <td>${burstTimes[i]}</td>
              <td>${finishTimes[i]}</td>
              <td>${finishTimes[i] - parseInt(arrivalTimes[i])}</td>
              <td>${Math.max(
                0,
                finishTimes[i] -
                  parseInt(arrivalTimes[i]) -
                  parseInt(burstTimes[i])
              )}</td>
          </tr>
      `;
  }

  var totalTurnaroundTime = 0;
  for (var i = 0; i < arrivalTimes.length; i++) {
    var turnaroundTime = finishTimes[i] - parseInt(arrivalTimes[i]);
    totalTurnaroundTime += turnaroundTime;
  }

  var averageTurnaroundTime = totalTurnaroundTime / arrivalTimes.length;
  var averageWaitingTime = totalWaitingTime / arrivalTimes.length;

  outputHTML += `
      <tr>
          <td colspan="4"><b>Average</b></td>
          <td>${averageTurnaroundTime.toFixed(2)}</td>
          <td>${averageWaitingTime.toFixed(2)}</td>
      </tr>
  `;

  outputHTML += `</table>`;

  // Display the output table
  var outputDiv = document.getElementById("output");
  outputDiv.innerHTML = outputHTML;
}

// RR function implementation
function rr(arrivalTime, burstTime, timeQuantum) {
  const processesInfo = arrivalTime
    .map((item, index) => {
      const job =
        arrivalTime.length > 26
          ? `P${index + 1}`
          : (index + 10).toString(36).toUpperCase();

      return {
        job,
        at: item,
        bt: burstTime[index],
      };
    })
    .sort((obj1, obj2) => {
      if (obj1.at > obj2.at) return 1;
      if (obj1.at < obj2.at) return -1;
      return 0;
    });

  const solvedProcessesInfo = [];
  const ganttChartInfo = [];

  const readyQueue = [];
  let currentTime = processesInfo[0].at;
  const unfinishedJobs = [...processesInfo];

  const remainingTime = processesInfo.reduce((acc, process) => {
    acc[process.job] = process.bt;
    return acc;
  }, {});

  readyQueue.push(unfinishedJobs[0]);
  while (
    Object.values(remainingTime).reduce((acc, cur) => acc + cur, 0) &&
    unfinishedJobs.length > 0
  ) {
    if (readyQueue.length === 0 && unfinishedJobs.length > 0) {
      readyQueue.push(unfinishedJobs[0]);
      currentTime = readyQueue[0].at;
    }

    const processToExecute = readyQueue[0];

    if (remainingTime[processToExecute.job] <= timeQuantum) {
      const remainingT = remainingTime[processToExecute.job];
      remainingTime[processToExecute.job] -= remainingT;
      const prevCurrentTime = currentTime;
      currentTime += remainingT;

      ganttChartInfo.push({
        job: processToExecute.job,
        start: prevCurrentTime,
        stop: currentTime,
      });
    } else {
      remainingTime[processToExecute.job] -= timeQuantum;
      const prevCurrentTime = currentTime;
      currentTime += timeQuantum;

      ganttChartInfo.push({
        job: processToExecute.job,
        start: prevCurrentTime,
        stop: currentTime,
      });
    }

    const processToArriveInThisCycle = processesInfo.filter((p) => {
      return (
        p.at <= currentTime &&
        p !== processToExecute &&
        !readyQueue.includes(p) &&
        unfinishedJobs.includes(p)
      );
    });

    readyQueue.push(...processToArriveInThisCycle);
    readyQueue.push(readyQueue.shift());

    if (remainingTime[processToExecute.job] === 0) {
      const indexToRemoveUJ = unfinishedJobs.indexOf(processToExecute);
      if (indexToRemoveUJ > -1) {
        unfinishedJobs.splice(indexToRemoveUJ, 1);
      }
      const indexToRemoveRQ = readyQueue.indexOf(processToExecute);
      if (indexToRemoveRQ > -1) {
        readyQueue.splice(indexToRemoveRQ, 1);
      }

      solvedProcessesInfo.push({
        ...processToExecute,
        ft: currentTime,
        tat: currentTime - processToExecute.at,
        wat: currentTime - processToExecute.at - processToExecute.bt,
      });
    }
  }

  solvedProcessesInfo.sort((obj1, obj2) => {
    if (obj1.at > obj2.at) return 1;
    if (obj1.at < obj2.at) return -1;
    if (obj1.job > obj2.job) return 1;
    if (obj1.job < obj2.job) return -1;
    return 0;
  });

  return { solvedProcessesInfo, ganttChartInfo };
}
