import semaphore from "semaphore";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Queue from "./Queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const data = await readFile(join(__dirname, "../data/jobs.json"), "utf-8");
const jobs = JSON.parse(data);

const sem = semaphore(2);

const jobsQueue = new Queue();

jobs.forEach((job) => {
  jobsQueue.enqueue({
    id: job.id,
    secondsToComplete: job.secondsToComplete,
  });
});

function processJob(job) {
  return new Promise((resolve, reject) => {
    const jobWillFail = Math.random() < 0.5;

    if (jobWillFail) {
      return reject(new Error(`Job with id ${job.id} failed`));
    }

    setTimeout(() => {
      resolve(`✅ Job with id ${job.id} completed`);
    }, job.secondsToComplete * 1000);
  });
}

function processQueue() {
  if (jobsQueue.isEmpty()) {
    console.log("All jobs processed");
    return;
  }

  const job = jobsQueue.dequeue();

  sem.take(() => {
    processJob(job)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.error(`❌ ${error.message}`);
      })
      .finally(() => {
        sem.leave();
        processQueue();
      });
  });
}

console.log("Starting job processing...");
processQueue();
