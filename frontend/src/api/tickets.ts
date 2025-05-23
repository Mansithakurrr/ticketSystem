// src/api/tickets.ts
import axios from 'axios'; // You'll need to install axios: npm install axios or yarn add axios

const API_BASE_URL = 'http://localhost:5000/api'; // Replace with your actual backend URL

export const getTicketById = async (ticketId: string, token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Assuming you use Bearer token for authentication
      },
    });
    return response.data.ticket; // The API returns { message, ticket }
  } catch (error) {
    console.error('Error fetching ticket by ID:', error);
    throw error;
  }
};

// export const addTicketComment = async (ticketId: string, content: string, isInternal: boolean, token: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
//       content,
//       isInternal,
//     }, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     });
//     return response.data.comment; // Assuming your add comment API returns the new comment
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     throw error;
//   }
// };