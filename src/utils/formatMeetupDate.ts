const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export const formatMeetupDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${dayFormatter.format(date)} • ${timeFormatter.format(date)}`;
};
