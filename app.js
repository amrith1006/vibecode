// Determine API URLs based on environment
const apiUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== ""
    ? `http://${window.location.hostname}:${window.location.port}/api/jobs`
    : "/api/jobs";

const finalApiUrl = (window.location.protocol === "file:") ? "http://127.0.0.1:8000/api/jobs" : apiUrl;

// Read Jobs
async function fetchJobs() {
    const tbody = document.getElementById('job-tbody');
    if (!tbody) return; // Exit early if we're not on jobs.html

    try {
        const response = await fetch(finalApiUrl);
        if (!response.ok) throw new Error("Failed to fetch jobs");

        const jobs = await response.json();

        if (jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="loading">No open positions right now. Be the first to post one!</td></tr>`;
            return;
        }

        tbody.innerHTML = ''; // clear loading block

        jobs.reverse().forEach((job, index) => {
            const tr = document.createElement('tr');
            tr.className = 'job-row';
            tr.style.animationDelay = `${index * 0.1}s`;

            tr.innerHTML = `
                <td><strong>${escapeHTML(job.company_name)}</strong></td>
                <td>
                    ${escapeHTML(job.title)}
                    <br><small style="color: var(--text-muted);">📍 ${escapeHTML(job.location)}</small>
                </td>
                <td>${escapeHTML(job.description).substring(0, 150)}${job.description.length > 150 ? '...' : ''}</td>
                <td>
                    <button class="btn-delete table-btn-delete" onclick="deleteJob(${job.id})" title="Delete Job">❌ Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        tbody.innerHTML = `<tr><td colspan="4" style="color: #ff6b6b; padding: 2rem; text-align: center;">Could not load jobs. Ensure the backend is running and the database is connected.</td></tr>`;
    }
}

// Write Jobs
const jobForm = document.getElementById('job-form');
if (jobForm) {
    jobForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = "Publishing... 🌐";
        btn.disabled = true;

        const newJob = {
            title: document.getElementById('title').value,
            company_name: document.getElementById('company_name').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value
        };

        const postApiUrl = finalApiUrl.replace("/api/jobs", "/api/job/post");

        try {
            const response = await fetch(postApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newJob)
            });

            if (!response.ok) throw new Error("Failed to create job");

            // Complete successfully
            document.getElementById('job-form').reset();
            document.getElementById('company_name').value = "Vibecode.ai Technologies"; // reset readonly input

            btn.innerHTML = "Success! ✨";
            btn.style.background = "linear-gradient(135deg, #06d6a0, #118ab2)";

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = "";
                btn.disabled = false;
            }, 2500);

        } catch (error) {
            console.error("Error creating job:", error);
            btn.innerHTML = "Oops, Error! ⚠️";
            btn.style.background = "linear-gradient(135deg, #ef476f, #d00000)";

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = "";
                btn.disabled = false;
            }, 3000);
        }
    });
}

// Delete Job
async function deleteJob(jobId) {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
        const deleteUrl = finalApiUrl + '/' + jobId;
        const response = await fetch(deleteUrl, { method: 'DELETE' });

        if (!response.ok) throw new Error("Failed to delete job");

        // Refresh UI
        fetchJobs();
    } catch (error) {
        console.error("Error deleting job:", error);
        alert("Oops! Could not delete the job right now.");
    }
}

// HTML escaping helper
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Initialization
if (document.getElementById('job-tbody') || document.getElementById('job-container')) {
    fetchJobs();
}
