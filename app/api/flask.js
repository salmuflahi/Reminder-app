import axios from 'axios';
import BASE_URL from './config'; 

export const fetchActivities = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/activities`);
    return res.data;
  } catch (err) {
    console.error('Error fetching activities:', err.message);
    return [];
  }
};
