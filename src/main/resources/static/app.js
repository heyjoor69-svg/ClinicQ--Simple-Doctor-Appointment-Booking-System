const state = {
  doctors: [],
  patients: [],
  appointments: [],
  slots: [],
  appointmentFilter: 'all',
  availabilityDate: '',
  availabilityDoctor: '',
  availableOnly: false,
  pendingConfirmation: null
};

const panelNames = {
  dashboard: 'Overview',
  appointments: 'Appointments',
  patients: 'Patients',
  doctors: 'Doctors',
  availability: 'Availability'
};

const today = localDateString();
const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

function displayDate(value, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, options).format(date);
}

function displayTime(value) {
  if (!value) return '—';
  const parts = value.split(':');
  const hour = Number(parts[0]);
  const minute = parts[1] || '00';
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const validation = body?.errors ? Object.values(body.errors).join(' ') : '';
    throw new Error(validation || body?.message || `Request failed (${response.status})`);
  }
  return body;
}

async function getSlotsForDoctors(doctors = state.doctors) {
  const groups = await Promise.all(doctors.map(async (doctor) => {
    const slots = await api(`/api/doctors/${doctor.id}/slots`);
    return slots.map((slot) => ({ ...slot, doctorId: doctor.id, doctorName: doctor.name }));
  }));
  return groups.flat();
}

async function loadData({ quiet = false } = {}) {
  try {
    const [doctors, patients, appointments] = await Promise.all([
      api('/api/doctors'), api('/api/patients'), api('/api/appointments')
    ]);
    state.doctors = doctors;
    state.patients = patients;
    state.appointments = appointments;
    state.slots = await getSlotsForDoctors(doctors);
    setConnection(true);
    renderAll();
    if (!quiet) showToast('Clinic data is up to date.');
  } catch (error) {
    setConnection(false);
    showToast(error.message || 'Could not connect to the clinic API.', true);
  }
}

function setConnection(online) {
  const indicator = document.querySelector('.connection-dot');
  indicator.classList.toggle('offline', !online);
  byId('connection-label').textContent = online ? 'Clinic API connected' : 'Clinic API unavailable';
  byId('footer-connection').textContent = online ? 'Connected to local clinic API' : 'Waiting for clinic API';
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.innerHTML = `<span class="toast-icon">${isError ? '!' : '✓'}</span><span>${escapeHtml(message)}</span>`;
  byId('toast-region').append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function emptyState(title, copy, action = '', actionLabel = '') {
  return `<div class="empty-state"><span class="empty-state-mark"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p>${action ? `<button class="button button-primary" data-action="${action}" type="button" style="margin-top:13px">${escapeHtml(actionLabel)}</button>` : ''}</div>`;
}

function appointmentDetails(appointment) {
  const nestedSlot = appointment.slot || {};
  const slot = state.slots.find((item) => Number(item.id) === Number(nestedSlot.id)) || nestedSlot;
  const nestedPatient = appointment.patient || {};
  return {
    patient: nestedPatient,
    slot,
    doctorName: slot.doctorName || 'Doctor',
    date: slot.slotDate || appointment.appointmentDate,
    startTime: slot.startTime || '',
    endTime: slot.endTime || ''
  };
}

function statusPill(value, available = false) {
  if (available) return `<span class="status-pill ${value ? 'status-available' : 'status-unavailable'}">${value ? 'Available' : 'Booked'}</span>`;
  const cancelled = value === 'CANCELLED';
  return `<span class="status-pill ${cancelled ? 'status-cancelled' : 'status-booked'}">${cancelled ? 'Cancelled' : 'Booked'}</span>`;
}

function patientCell(patient) {
  return `<div class="patient-cell"><span class="mini-avatar">${escapeHtml(initials(patient?.name))}</span><span><strong>${escapeHtml(patient?.name || 'Patient')}</strong><small>${escapeHtml(patient?.email || '')}</small></span></div>`;
}

function renderAll() {
  renderDashboard();
  renderAppointments();
  renderPatients();
  renderDoctors();
  renderAvailability();
  renderSelectOptions();
}

function renderDashboard() {
  const bookedToday = state.appointments.filter((appointment) => appointment.status === 'BOOKED' && appointmentDetails(appointment).date === today);
  const upcomingSlots = state.slots.filter((slot) => slot.available && slot.slotDate >= today);
  byId('stat-today').textContent = bookedToday.length;
  byId('stat-today-note').textContent = bookedToday.length === 1 ? 'One visit on today’s schedule' : 'Scheduled for today';
  byId('stat-open').textContent = upcomingSlots.length;
  byId('stat-doctors').textContent = state.doctors.length;
  byId('stat-patients').textContent = state.patients.length;
  byId('nav-appointment-count').textContent = state.appointments.filter((item) => item.status === 'BOOKED').length;
  byId('dashboard-date').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  byId('today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  const agenda = bookedToday.map((appointment) => ({ appointment, details: appointmentDetails(appointment) }))
    .sort((a, b) => a.details.startTime.localeCompare(b.details.startTime));
  byId('today-agenda').innerHTML = agenda.length ? agenda.slice(0, 5).map(({ appointment, details }) => `
    <div class="agenda-item"><span class="agenda-time">${displayTime(details.startTime)}</span><span class="agenda-rail"></span><span class="agenda-person"><strong>${escapeHtml(details.patient.name || 'Patient')}</strong><small>${escapeHtml(details.doctorName)}${details.endTime ? ` · until ${displayTime(details.endTime)}` : ''}</small></span><span class="agenda-type">${escapeHtml(appointment.status)}</span></div>`).join('') : emptyState('Nothing on the schedule yet', 'New bookings for today will appear here.', 'book', 'Book a visit');

  const recent = [...state.appointments].sort((a, b) => `${appointmentDetails(b).date}${appointmentDetails(b).startTime}`.localeCompare(`${appointmentDetails(a).date}${appointmentDetails(a).startTime}`)).slice(0, 5);
  byId('recent-appointments').innerHTML = recent.length ? recent.map((appointment) => {
    const details = appointmentDetails(appointment);
    return `<tr><td>${patientCell(details.patient)}</td><td>${escapeHtml(details.doctorName)}</td><td>${displayDate(details.date)}</td><td>${displayTime(details.startTime)}</td><td>${statusPill(appointment.status)}</td><td></td></tr>`;
  }).join('') : `<tr><td class="empty-table" colspan="5">No appointments to show yet.</td></tr>`;
}

function renderAppointments() {
  const query = byId('appointment-search').value.trim().toLowerCase();
  const all = state.appointments;
  const booked = all.filter((item) => item.status === 'BOOKED');
  const cancelled = all.filter((item) => item.status === 'CANCELLED');
  byId('count-all').textContent = all.length;
  byId('count-booked').textContent = booked.length;
  byId('count-cancelled').textContent = cancelled.length;
  let list = state.appointmentFilter === 'all' ? all : all.filter((item) => item.status === state.appointmentFilter);
  if (query) list = list.filter((item) => {
    const details = appointmentDetails(item);
    return `${details.patient.name || ''} ${details.doctorName}`.toLowerCase().includes(query);
  });
  list = [...list].sort((a, b) => `${appointmentDetails(a).date}${appointmentDetails(a).startTime}`.localeCompare(`${appointmentDetails(b).date}${appointmentDetails(b).startTime}`));
  byId('appointments-table').innerHTML = list.length ? list.map((appointment) => {
    const details = appointmentDetails(appointment);
    const action = appointment.status === 'BOOKED' ? `<button class="small-button danger-text" type="button" data-cancel-appointment="${Number(appointment.id)}">Cancel</button>` : '<span class="muted-dash">—</span>';
    return `<tr><td>${patientCell(details.patient)}</td><td>${escapeHtml(details.doctorName)}</td><td>${displayDate(details.date, { year: 'numeric', month: 'short', day: 'numeric' })}</td><td>${displayTime(details.startTime)}${details.endTime ? ` – ${displayTime(details.endTime)}` : ''}</td><td>${statusPill(appointment.status)}</td><td>${action}</td></tr>`;
  }).join('') : `<tr><td class="empty-table" colspan="6">${query ? 'No appointments match that search.' : 'No appointments in this view yet.'}</td></tr>`;
}

const avatarClasses = ['avatar-green', 'avatar-blue', 'avatar-coral', 'avatar-yellow', 'avatar-lilac'];
function renderPatients() {
  const query = byId('patient-search').value.trim().toLowerCase();
  const patients = state.patients.filter((person) => `${person.name} ${person.email} ${person.phone}`.toLowerCase().includes(query));
  byId('patient-result-label').textContent = `${patients.length} ${patients.length === 1 ? 'patient' : 'patients'}`;
  byId('patients-grid').innerHTML = patients.length ? patients.map((patient, index) => `
    <article class="directory-card"><div class="directory-card-top"><span class="directory-avatar ${avatarClasses[index % avatarClasses.length]}">${escapeHtml(initials(patient.name))}</span><div class="directory-ident"><h3>${escapeHtml(patient.name)}</h3><p class="specialty">Patient #${escapeHtml(patient.id)}</p></div></div><div class="directory-meta"><span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>${escapeHtml(patient.email)}</span><span><svg viewBox="0 0 24 24"><path d="M7 3H5a2 2 0 0 0-2 2c0 8.8 7.2 16 16 16a2 2 0 0 0 2-2v-2l-5-2-2 3a14 14 0 0 1-7-7l3-2-3-5Z"/></svg>${escapeHtml(patient.phone)}</span></div><div class="directory-actions"><button class="small-button" type="button" data-book-patient="${Number(patient.id)}">Book appointment</button></div></article>`).join('') : emptyState(query ? 'No matching patients' : 'No patient records yet', query ? 'Try another name, email or phone number.' : 'Add your first patient to start scheduling care.', query ? '' : 'add-patient', query ? '' : 'Add patient');
}

function renderDoctors() {
  const query = byId('doctor-search').value.trim().toLowerCase();
  const doctors = state.doctors.filter((doctor) => `${doctor.name} ${doctor.specialization} ${doctor.email} ${doctor.phone}`.toLowerCase().includes(query));
  byId('doctor-result-label').textContent = `${doctors.length} ${doctors.length === 1 ? 'doctor' : 'doctors'}`;
  byId('doctors-grid').innerHTML = doctors.length ? doctors.map((doctor, index) => {
    const totalSlots = state.slots.filter((slot) => Number(slot.doctorId) === Number(doctor.id)).length;
    const initialsClass = avatarClasses[(index + 1) % avatarClasses.length];
    return `<article class="directory-card"><div class="directory-card-top"><span class="directory-avatar ${initialsClass}">${escapeHtml(initials(doctor.name))}</span><div class="directory-ident"><h3>${escapeHtml(doctor.name)}</h3><p class="specialty">${escapeHtml(doctor.specialization)}</p></div></div><div class="directory-meta"><span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>${escapeHtml(doctor.email)}</span><span><svg viewBox="0 0 24 24"><path d="M7 3H5a2 2 0 0 0-2 2c0 8.8 7.2 16 16 16a2 2 0 0 0 2-2v-2l-5-2-2 3a14 14 0 0 1-7-7l3-2-3-5Z"/></svg>${escapeHtml(doctor.phone)}</span><span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${totalSlots} published ${totalSlots === 1 ? 'slot' : 'slots'}</span></div><div class="directory-actions"><button class="small-button" type="button" data-add-doctor-slot="${Number(doctor.id)}">Add availability</button><button class="small-button danger-text" type="button" data-delete-doctor="${Number(doctor.id)}">Remove</button></div></article>`;
  }).join('') : emptyState(query ? 'No matching doctors' : 'No doctors added yet', query ? 'Try another name or specialization.' : 'Add a doctor before publishing appointment availability.', query ? '' : 'add-doctor', query ? '' : 'Add doctor');
}

function renderAvailability() {
  let slots = state.slots;
  if (state.availabilityDoctor) slots = slots.filter((slot) => String(slot.doctorId) === state.availabilityDoctor);
  if (state.availabilityDate) slots = slots.filter((slot) => slot.slotDate === state.availabilityDate);
  if (state.availableOnly) slots = slots.filter((slot) => slot.available);
  slots = [...slots].sort((a, b) => `${a.slotDate}${a.startTime}`.localeCompare(`${b.slotDate}${b.startTime}`));
  byId('slots-table').innerHTML = slots.length ? slots.map((slot) => `<tr><td>${displayDate(slot.slotDate, { year: 'numeric', month: 'short', day: 'numeric' })}</td><td>${displayTime(slot.startTime)} – ${displayTime(slot.endTime)}</td><td>${escapeHtml(slot.doctorName)}</td><td>${statusPill(slot.available, true)}</td><td></td></tr>`).join('') : `<tr><td class="empty-table" colspan="5">${state.doctors.length ? 'No slots match these filters.' : 'Add a doctor before publishing availability.'}</td></tr>`;
}

function renderSelectOptions() {
  const availabilityDoctor = byId('availability-doctor');
  const oldDoctor = availabilityDoctor.value;
  availabilityDoctor.innerHTML = `<option value="">All doctors</option>${state.doctors.map((doctor) => `<option value="${Number(doctor.id)}">${escapeHtml(doctor.name)}</option>`).join('')}`;
  availabilityDoctor.value = oldDoctor;

  const doctorOptions = `<option value="">Choose a doctor</option>${state.doctors.map((doctor) => `<option value="${Number(doctor.id)}">${escapeHtml(doctor.name)} · ${escapeHtml(doctor.specialization)}</option>`).join('')}`;
  const slotDoctorSelect = byId('slot-form').elements.doctorId;
  const currentSlotDoctor = slotDoctorSelect.value;
  slotDoctorSelect.innerHTML = doctorOptions;
  if (state.doctors.some((doctor) => String(doctor.id) === currentSlotDoctor)) slotDoctorSelect.value = currentSlotDoctor;

  const bookingDoctor = byId('booking-doctor');
  const currentBookingDoctor = bookingDoctor.value;
  bookingDoctor.innerHTML = doctorOptions;
  if (state.doctors.some((doctor) => String(doctor.id) === currentBookingDoctor)) bookingDoctor.value = currentBookingDoctor;

  const patientSelect = byId('booking-form').elements.patientId;
  const currentPatient = patientSelect.value;
  patientSelect.innerHTML = `<option value="">Choose a patient</option>${state.patients.map((patient) => `<option value="${Number(patient.id)}">${escapeHtml(patient.name)} · ${escapeHtml(patient.email)}</option>`).join('')}`;
  if (state.patients.some((patient) => String(patient.id) === currentPatient)) patientSelect.value = currentPatient;
  renderBookingSlots();
}

function renderBookingSlots() {
  const doctorId = byId('booking-doctor').value;
  const select = byId('booking-slot');
  const candidates = state.slots.filter((slot) => slot.available && slot.slotDate >= today && String(slot.doctorId) === doctorId)
    .sort((a, b) => `${a.slotDate}${a.startTime}`.localeCompare(`${b.slotDate}${b.startTime}`));
  select.innerHTML = `<option value="">${candidates.length ? 'Choose a time' : 'No available times'}</option>${candidates.map((slot) => `<option value="${Number(slot.id)}">${displayDate(slot.slotDate, { weekday: 'short', month: 'short', day: 'numeric' })} · ${displayTime(slot.startTime)}–${displayTime(slot.endTime)}</option>`).join('')}`;
  byId('booking-hint').textContent = !state.patients.length ? 'Add a patient before booking an appointment.' : !doctorId ? 'Choose a doctor to see available times.' : candidates.length ? `${candidates.length} available ${candidates.length === 1 ? 'time' : 'times'} for this doctor.` : 'This doctor has no future availability. Publish a slot to continue.';
}

function showView(name) {
  const view = panelNames[name] ? name : 'dashboard';
  document.querySelectorAll('.page-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${view}`));
  document.querySelectorAll('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  byId('breadcrumb-current').textContent = panelNames[view];
  byId('sidebar').classList.remove('open');
  byId('sidebar-scrim').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal(id) {
  const dialog = byId(id);
  if (id === 'slot-modal' && !state.doctors.length) {
    showToast('Add a doctor before publishing availability.', true);
    showView('doctors');
    return;
  }
  if (id === 'booking-modal' && !state.patients.length) {
    showToast('Add a patient before booking an appointment.', true);
    showView('patients');
    return;
  }
  if (id === 'booking-modal' && !state.doctors.length) {
    showToast('Add a doctor before booking an appointment.', true);
    showView('doctors');
    return;
  }
  renderSelectOptions();
  dialog.showModal();
}

function openConfirmation(title, copy, buttonLabel, action, danger = true) {
  byId('confirm-title').textContent = title;
  byId('confirm-copy').textContent = copy;
  byId('confirm-accept').textContent = buttonLabel;
  byId('confirm-accept').className = `button ${danger ? 'button-danger' : 'button-primary'}`;
  state.pendingConfirmation = action;
  byId('confirm-modal').showModal();
}

function handleAction(action) {
  if (action === 'book') openModal('booking-modal');
  if (action === 'add-doctor') openModal('doctor-modal');
  if (action === 'add-patient') openModal('patient-modal');
  if (action === 'add-slot') openModal('slot-modal');
}

async function submitForm(form, path, method, successMessage) {
  const submit = form.querySelector('[type="submit"]');
  const originalText = submit.textContent;
  submit.disabled = true;
  submit.textContent = 'Saving…';
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    await api(path, { method, body: JSON.stringify(data) });
    form.reset();
    form.closest('dialog').close();
    await loadData({ quiet: true });
    showToast(successMessage);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    submit.disabled = false;
    submit.textContent = originalText;
  }
}

function bindEvents() {
  document.addEventListener('click', async (event) => {
    const nav = event.target.closest('[data-view], [data-nav]');
    if (nav) {
      showView(nav.dataset.view || nav.dataset.nav);
      return;
    }
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      handleAction(actionButton.dataset.action);
      return;
    }
    if (event.target.closest('[data-close-modal]')) {
      event.target.closest('dialog').close();
      return;
    }
    const cancelButton = event.target.closest('[data-cancel-appointment]');
    if (cancelButton) {
      const id = Number(cancelButton.dataset.cancelAppointment);
      openConfirmation('Cancel appointment?', 'The slot will become available for another patient.', 'Cancel appointment', async () => {
        try {
          await api(`/api/appointments/${id}/cancel`, { method: 'PUT' });
          await loadData({ quiet: true });
          showToast('Appointment cancelled. The time slot is available again.');
        } catch (error) { showToast(error.message, true); }
      });
      return;
    }
    const patientButton = event.target.closest('[data-book-patient]');
    if (patientButton) {
      openModal('booking-modal');
      byId('booking-form').elements.patientId.value = patientButton.dataset.bookPatient;
      return;
    }
    const slotButton = event.target.closest('[data-add-doctor-slot]');
    if (slotButton) {
      openModal('slot-modal');
      byId('slot-form').elements.doctorId.value = slotButton.dataset.addDoctorSlot;
      return;
    }
    const deleteButton = event.target.closest('[data-delete-doctor]');
    if (deleteButton) {
      const doctor = state.doctors.find((item) => Number(item.id) === Number(deleteButton.dataset.deleteDoctor));
      if (!doctor) return;
      openConfirmation('Remove this doctor?', `${doctor.name} and their slots will be removed. Existing bookings may prevent removal.`, 'Remove doctor', async () => {
        try {
          await api(`/api/doctors/${doctor.id}`, { method: 'DELETE' });
          await loadData({ quiet: true });
          showToast(`${doctor.name} removed.`);
        } catch (error) { showToast(error.message, true); }
      });
    }
  });

  document.querySelectorAll('[data-appointment-filter]').forEach((button) => button.addEventListener('click', () => {
    state.appointmentFilter = button.dataset.appointmentFilter;
    document.querySelectorAll('[data-appointment-filter]').forEach((segment) => segment.classList.toggle('active', segment === button));
    renderAppointments();
  }));

  byId('doctor-search').addEventListener('input', renderDoctors);
  byId('patient-search').addEventListener('input', renderPatients);
  byId('appointment-search').addEventListener('input', renderAppointments);
  byId('availability-doctor').addEventListener('change', (event) => { state.availabilityDoctor = event.target.value; renderAvailability(); });
  byId('availability-date').addEventListener('change', (event) => { state.availabilityDate = event.target.value; renderAvailability(); });
  byId('available-only').addEventListener('change', (event) => { state.availableOnly = event.target.checked; renderAvailability(); });
  byId('booking-doctor').addEventListener('change', renderBookingSlots);
  byId('refresh-button').addEventListener('click', () => loadData());
  byId('menu-toggle').addEventListener('click', () => { byId('sidebar').classList.add('open'); byId('sidebar-scrim').classList.add('visible'); });
  byId('sidebar-scrim').addEventListener('click', () => { byId('sidebar').classList.remove('open'); byId('sidebar-scrim').classList.remove('visible'); });
  byId('confirm-accept').addEventListener('click', async () => {
    const action = state.pendingConfirmation;
    state.pendingConfirmation = null;
    byId('confirm-modal').close();
    if (action) await action();
  });
  byId('confirm-modal').addEventListener('close', () => { state.pendingConfirmation = null; });

  byId('doctor-form').addEventListener('submit', (event) => { event.preventDefault(); submitForm(event.currentTarget, '/api/doctors', 'POST', 'Doctor added to the care team.'); });
  byId('patient-form').addEventListener('submit', (event) => { event.preventDefault(); submitForm(event.currentTarget, '/api/patients', 'POST', 'Patient record created.'); });
  byId('slot-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const doctorId = form.elements.doctorId.value;
    const start = form.elements.startTime.value;
    const end = form.elements.endTime.value;
    if (start >= end) { showToast('End time must be later than start time.', true); return; }
    submitForm(form, `/api/doctors/${doctorId}/slots`, 'POST', 'Availability published.');
  });
  byId('booking-form').addEventListener('submit', (event) => { event.preventDefault(); submitForm(event.currentTarget, '/api/appointments', 'POST', 'Appointment booked successfully.'); });
}

function initialize() {
  byId('slot-date').min = today;
  byId('availability-date').min = today;
  byId('availability-date').value = '';
  bindEvents();
  loadData({ quiet: true });
}

initialize();
