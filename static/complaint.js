// ─── GEMINI CONFIG ───────────────────────────────────────────
const GEMINI_API_KEY = 'AIzaSyD7ISUJIfnRrXIQmWrzeo5TToY02P0krD4';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── IMAGE PREVIEW ────────────────────────────────────────────
document.getElementById('image').addEventListener('change', function () {
  const file = this.files[0];
  const preview = document.getElementById('previewImage');
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add('d-none');
  }
});

// ─── AI ASSIST BUTTON ─────────────────────────────────────────
document.getElementById('aiAssistBtn').addEventListener('click', async function () {
  const imageInput = document.getElementById('image');
  const descriptionEl = document.getElementById('description');
  const categoryEl = document.getElementById('category');
  const file = imageInput.files[0];

  this.disabled = true;
  this.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Analyzing...`;

  if (file) {
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const body = {
        contents: [{
          parts: [
            {
              text: "You are a civic complaint assistant for an Indian municipal portal. Look at this image carefully and write a short, formal civic complaint in exactly 2-3 sentences. Be specific about what you see — describe the visible issue, its apparent severity, and the type of location. Write in formal third-person tone. Output only the complaint sentences, nothing else."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 200
        }
      };

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'Gemini API error');
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        descriptionEl.value = text.trim();
        showToast('✨ AI description generated from your image!', 'success');
      } else {
        throw new Error('No text in response');
      }

    } catch (err) {
      console.error('Gemini error:', err);
      const category = categoryEl.value || 'General';
      descriptionEl.value = getTemplateFallback(category);
      showToast('Used smart template (image AI unavailable).', 'info');
    }

  } else {
    const category = categoryEl.value;
    if (!category) {
      this.disabled = false;
      this.innerHTML = `<i class="bi bi-stars me-1"></i> Generate Description with AI`;
      showToast('Please select a category or upload an image first.', 'warning');
      return;
    }
    await new Promise(r => setTimeout(r, 600));
    descriptionEl.value = getTemplateFallback(category);
    showToast('AI description generated!', 'success');
  }

  this.disabled = false;
  this.innerHTML = `<i class="bi bi-stars me-1"></i> Generate Description with AI`;
});

// ─── FILE → BASE64 ───────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── FALLBACK TEMPLATES ──────────────────────────────────────
function getTemplateFallback(category) {
  const t = {
    'Garbage': 'There is an overflowing garbage bin at the reported location that has not been cleared for several days. The accumulation of waste is causing foul odors and poses a public health hazard to nearby residents. Immediate intervention by the Sanitation Department is urgently requested.',
    'Street Light': 'The street lights at the reported location have been non-functional for multiple consecutive days, creating dangerous conditions for pedestrians and motorists after dark. This poses a significant safety risk, especially for children and elderly residents commuting at night. Urgent repair by the Electricity Department is required.',
    'Road Damage': 'There is significant road damage at the reported location, with multiple deep potholes and severely deteriorated surface conditions. The damage is causing vehicle disruptions and poses serious accident risks, particularly for two-wheelers. Immediate repair by the Roads & Infrastructure Department is necessary.',
    'Water Supply': 'There has been a complete interruption in the water supply at the reported location for the past several days without prior notice to residents. Citizens are unable to meet their daily water requirements and are facing severe inconvenience. Prompt resolution by the Water Supply Department is urgently needed.',
  };
  return t[category] || `There is a ${category.toLowerCase()} issue at the reported location that has been causing significant inconvenience to local residents. The problem requires urgent attention from the relevant municipal department. Immediate action is requested to restore normal civic services in the affected area.`;
}

// ─── DEPT MAP ────────────────────────────────────────────────
const deptMap = {
  'Garbage': 'Sanitation Dept.',
  'Street Light': 'Electricity Dept.',
  'Road Damage': 'Roads & Infrastructure',
  'Water Supply': 'Water Supply Dept.'
};

// ─── FORM SUBMIT ─────────────────────────────────────────────
document.getElementById('complaintForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value.trim();
  const location = document.getElementById('location').value.trim();

  if (!category || !description || !location) {
    showToast('Please fill all required fields.', 'warning');
    return;
  }

  const complaints = JSON.parse(localStorage.getItem('civiccare_complaints') || '[]');
  const newId = 'CC-' + (1001 + complaints.length);

  let citizenName = 'Citizen';
  try { const u = JSON.parse(localStorage.getItem('civiccare_user')||'{}'); if(u.name) citizenName = u.name; } catch(e){}

  complaints.push({ id: newId, category, description, location, department: deptMap[category]||'Municipal Dept.', status: 'Pending', date: new Date().toISOString(), citizen: citizenName });
  localStorage.setItem('civiccare_complaints', JSON.stringify(complaints));

  // Push notification
  const notifs = JSON.parse(localStorage.getItem('civiccare_notifs') || '[]');
  notifs.unshift({ id:`n-${newId}`, type:'status', title:'Complaint Submitted', desc:`Your complaint #${newId} (${category}) has been received and is under review.`, time:new Date().toISOString(), read:false, icon:'bi-inbox', iconClass:'ni-blue' });
  localStorage.setItem('civiccare_notifs', JSON.stringify(notifs));

  showToast(`Complaint #${newId} submitted successfully!`, 'success');
  document.getElementById('complaintForm').reset();
  document.getElementById('previewImage').classList.add('d-none');
  setTimeout(() => { window.location.href = 'track.html'; }, 1500);
});

// ─── TOAST ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('civicToast');
  if (existing) existing.remove();
  const colors = { success:'#22c55e', danger:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
  const icons  = { success:'✓', danger:'✗', warning:'⚠', info:'ℹ' };
  const toast = document.createElement('div');
  toast.id = 'civicToast';
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:#0d1b2a;color:#fff;padding:0.85rem 1.25rem;border-radius:12px;font-size:0.88rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;display:flex;align-items:center;gap:0.6rem;max-width:340px;border-left:4px solid ${colors[type]||'#3b82f6'};animation:toastIn 0.3s ease;`;
  toast.innerHTML = `<span style="color:${colors[type]};font-weight:700;">${icons[type]||'i'}</span>${message}`;
  if (!document.getElementById('_toastCSS')) {
    const s = document.createElement('style');
    s.id = '_toastCSS';
    s.textContent = `@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes toastOut{from{opacity:1}to{opacity:0;transform:translateY(10px)}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3500);
}
