// Sample/seed complaints if none exist
const seedComplaints = [
  {
    id: 'CC-1001',
    category: 'Road Damage',
    description: 'Large pothole near FC Road junction causing accidents. The road surface has deteriorated significantly after recent rains.',
    location: 'FC Road Junction, Pune',
    department: 'Roads & Infrastructure',
    status: 'In Progress',
    date: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'CC-1002',
    category: 'Street Light',
    description: 'Three consecutive street lights are non-functional on Model Colony road, creating safety hazards at night.',
    location: 'Model Colony, Shivajinagar',
    department: 'Electricity Dept.',
    status: 'Pending',
    date: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'CC-1003',
    category: 'Garbage',
    description: 'Garbage has been overflowing from the municipal bins near Deccan Gymkhana for the past week without collection.',
    location: 'Deccan Gymkhana, Pune',
    department: 'Sanitation Dept.',
    status: 'Resolved',
    date: new Date(Date.now() - 12 * 86400000).toISOString()
  }
];

function initComplaints() {
  const existing = localStorage.getItem('civiccare_complaints');
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem('civiccare_complaints', JSON.stringify(seedComplaints));
  }
}

function getStatusBadge(status) {
  const map = {
    'Pending': 'warning',
    'In Progress': 'primary',
    'Resolved': 'success',
    'Rejected': 'danger'
  };
  return `<span class="badge bg-${map[status] || 'secondary'} bg-opacity-15 text-${map[status] || 'secondary'}">${status}</span>`;
}

function renderTable() {
  const complaints = JSON.parse(localStorage.getItem('civiccare_complaints') || '[]');
  const tbody = document.getElementById('complaintsTableBody');
  const totalEl = document.getElementById('totalComplaints');

  if (totalEl) totalEl.textContent = complaints.length;

  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No complaints yet. <a href="complaint.html">Raise one!</a></td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.slice().reverse().map(c => `
    <tr>
      <td><span class="text-muted fw-medium">${c.id}</span></td>
      <td>
        <span class="fw-medium">${c.category}</span>
        <div class="text-muted" style="font-size:0.76rem;">${c.location}</div>
      </td>
      <td>${getStatusBadge(c.status)}</td>
      <td style="font-size:0.82rem;">${c.department}</td>
      <td style="font-size:0.82rem;color:#64748b;">${new Date(c.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
      <td>
        <a href="track.html" class="btn btn-sm btn-outline-primary rounded-3" style="font-size:0.78rem;padding:0.25rem 0.7rem;">
          <i class="bi bi-eye me-1"></i>View
        </a>
      </td>
    </tr>
  `).join('');
}

// Load user
function loadUser() {
  try {
    const u = JSON.parse(localStorage.getItem('civiccare_user') || '{}');
    const welcomeEl = document.querySelector('h4.fw-semibold');
    if (welcomeEl && u.name) {
      welcomeEl.textContent = `Welcome, ${u.name.split(' ')[0]}!`;
    }
    // Update nav
    const navUser = document.querySelector('.navbar .ms-auto .fw-medium');
    if (navUser && u.name) navUser.textContent = u.name;
  } catch(e) {}
}

// Wire up Raise Complaint button
document.addEventListener('DOMContentLoaded', () => {
  initComplaints();
  loadUser();
  renderTable();

  // Wire nav links
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    if (link.getAttribute('href')) return; // already has href
  });

  const raiseBtn = document.querySelector('.btn.btn-primary');
  if (raiseBtn && raiseBtn.textContent.includes('Raise')) {
    raiseBtn.addEventListener('click', () => {
      window.location.href = 'complaint.html';
    });
  }
});
