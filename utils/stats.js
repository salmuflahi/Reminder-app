import BASE_URL from '../config'; // adjust path if needed

export async function getCompletedTasksCount(user) {
  try {
    const res = await fetch(`${BASE_URL}/activities?user=${user}`);
    const data = await res.json();
    if (data.status === 'success') {
      return data.reminders.filter(r => r.done).length;
    }
  } catch (err) {
    console.error('Error fetching reminders:', err);
  }
  return 0;
}
