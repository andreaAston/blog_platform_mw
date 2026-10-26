export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Turns an ApiError (or anything thrown) into text a person can read.
export function errorText(err) {
  if (err?.details?.length) return err.details.map((d) => d.message).join(' ');
  return err?.message || 'Something went wrong. Please try again.';
}
