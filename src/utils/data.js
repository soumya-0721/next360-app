export const DEFAULT_USERS = [
  { name: 'Samhith Reddy', email: 'samhithreddy@gmail.com', password: 'samhithreddy101', role: 'CEO' },
  { name: 'Shivaganesh', email: 'shivaganesh@gmail.com', password: 'shivaganesh102', role: 'CTO' },
  { name: 'Soumya', email: 'soumya@gmail.com', password: 'soumya103', role: 'Employee' },
  { name: 'Manaswini', email: 'manaswini@gmail.com', password: 'manaswini104', role: 'Employee' },
  { name: 'Harshitha', email: 'harshitha@gmail.com', password: 'harshitha105', role: 'Employee' },
  { name: 'Ashwanth', email: 'ashwanth@gmail.com', password: 'ashwanth106', role: 'Employee' },
  { name: 'Srinitha', email: 'srinitha@gmail.com', password: 'srinitha107', role: 'Employee' },
];

export const BIRTHDAYS_MAP = [
  { name: 'Samhith Reddy', month: 6, day: 12 },
  { name: 'Shivaganesh', month: 3, day: 22 },
  { name: 'Soumya', month: 2, day: 7 },
  { name: 'Manaswini', month: 7, day: 14 },
  { name: 'Harshitha', month: 8, day: 3 },
  { name: 'Ashwanth', month: 10, day: 19 },
  { name: 'Srinitha', month: 11, day: 28 },
];

export function daysUntilBirthday(month, day) {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
  return Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24));
}

export function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatTimeFull(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateLong(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getRoleBadgeColor(role) {
  if (role === 'CEO') return '#7c3aed';
  if (role === 'CTO') return '#2563eb';
  return '#10b981';
}

export function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase();
}
