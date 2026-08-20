const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync('./data/jobs.json', 'utf8'));

let filtered = [...jobs];

const filters = {
  framework: ["react"],
  location: "",
  remoteType: [],
  experienceLevel: ["SENIOR"],
  employmentType: ["FULL_TIME"],
  salaryMin: "",
  salaryMax: "",
  postedWithin: "",
  sortBy: "newest"
};

// Framework
if (filters.framework.length > 0) {
  filtered = filtered.filter((j) => {
    const text = `${j.title} ${j.description || ""}`.toLowerCase();
    return filters.framework.some((fw) => text.includes(fw.toLowerCase()));
  });
}

console.log("After framework:", filtered.length);

// Experience
if (filters.experienceLevel.length > 0) {
  filtered = filtered.filter(
    (j) => j.experienceLevel && filters.experienceLevel.includes(j.experienceLevel)
  );
}

console.log("After experienceLevel:", filtered.length);

// Employment
if (filters.employmentType.length > 0) {
  filtered = filtered.filter((j) => filters.employmentType.includes(j.employmentType));
}

console.log("After employmentType:", filtered.length);
