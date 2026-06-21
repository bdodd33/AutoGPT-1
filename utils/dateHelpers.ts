export function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString + 'T00:00:00');
  target.setFullYear(today.getFullYear());
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function daysUntilExact(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString + 'T00:00:00');
  if (target < today) return -1;
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDayOfYear(): number {
  const n = new Date();
  return Math.floor((n.getTime() - new Date(n.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function getUrgencyLevel(d: number): 'urgent' | 'soon' | 'upcoming' | 'future' {
  return d <= 1 ? 'urgent' : d <= 3 ? 'soon' : d <= 14 ? 'upcoming' : 'future';
}

export function formatCountdown(d: number): string {
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d < 7) return `In ${d} days`;
  if (d < 30) return `In ${Math.ceil(d / 7)} week${Math.ceil(d / 7) > 1 ? 's' : ''}`;
  return `In ${Math.ceil(d / 30)} month${Math.ceil(d / 30) > 1 ? 's' : ''}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function isToday(dateString: string): boolean {
  const today = new Date();
  const d = new Date(dateString + 'T00:00:00');
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
}

export function getMonthDay(dateString: string): string {
  const d = new Date(dateString + 'T00:00:00');
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
}
