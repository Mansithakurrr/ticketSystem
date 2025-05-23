// TicketsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketType, Comment, Attachment, Notification } from '../types';
import { tickets as mockTickets, notifications as mockNotifications } from '../data/mockData';
import { useAuth } from './AuthContext';
import axios from 'axios'; // Import axios

// Add AuthContextType interface if it doesn't exist in AuthContext
interface AuthContextType {
  currentUser: { id: string } | null;
  authToken: string | null;
}

interface TicketsContextType {
  tickets: Ticket[];
  notifications: Notification[];
  getTicketById: (id: string) => Ticket | undefined;
  getTicketsByUser: (userId: string) => Ticket[];
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  createTicket: (ticketData: FormData) => Promise<Ticket>; // Change parameter type to FormData
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<Ticket>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
  addComment: (ticketId: string, content: string, isInternal: boolean) => Promise<Comment>;
  addAttachment: (ticketId: string, file: File) => Promise<Attachment>;
  markNotificationAsRead: (id: string) => void;
  getUserNotifications: (userId: string) => Notification[];
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export const useTickets = (): TicketsContextType => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
};

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const { currentUser, authToken } = useAuth(); // Assuming authToken is available from useAuth

  const API_BASE_URL = '/api/tickets'; // Your backend API endpoint for tickets

  const fetchTickets = useCallback(async () => {
    if (!authToken) {
      console.warn('No auth token provided. Skipping ticket fetch.');
      return;
    }

    try {
      console.log('Fetching tickets from:', API_BASE_URL);
      const response = await axios.get(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Raw response from server:', response.data);
      const data = response.data;

      if (!Array.isArray(data.tickets)) {
        console.error('Received data structure:', data);
        throw new Error('Unexpected data format: Expected an array of tickets');
      }

      console.log('✅ Tickets fetched:', data.tickets.length);
      console.log('Ticket data:', data.tickets);
      setTickets(data.tickets);
    } catch (error) {
      console.error('❌ Failed to fetch tickets:', error);
    }
  }, [authToken]);
  

  useEffect(() => {
    console.log('TicketsContext mounted, authToken:', authToken ? 'present' : 'missing');
    if (authToken) {
      console.log('Initiating ticket fetch...');
      fetchTickets();
    }
  }, [fetchTickets, authToken]);

  const getTicketById = (id: string) => {
    return tickets.find(ticket => ticket.id === id);
  };

  const getTicketsByUser = (userId: string) => {
    return tickets.filter(ticket => ticket.userId === userId);
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const createTicket = async (ticketData: FormData): Promise<Ticket> => {
    try {
      if (currentUser?.id && !ticketData.has('userId')) {
        ticketData.append('userId', currentUser.id);
      }

      const response = await axios.post(API_BASE_URL, ticketData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const newTicket = response.data.ticket; // Access the ticket from the response data
      console.log('Created ticket:', newTicket);
      
      // Update local state with the new ticket
      setTickets(prevTickets => {
        const updatedTickets = [...prevTickets, newTicket];
        console.log('Updated tickets list:', updatedTickets);
        return updatedTickets;
      });

      // Create notification for admins
      const newNotification: Notification = {
        id: `notification-${notifications.length + 1}`,
        userId: 'admin-1',
        ticketId: newTicket.id,
        message: `New ticket submitted: "${newTicket.subject}"`,
        read: false,
        createdAt: new Date(),
        type: 'comment'
      };

      setNotifications(prev => [...prev, newNotification]);

      return newTicket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    // This function would also need to be updated to use actual API calls
    // For now, it's still using mock data simulation
    await new Promise(resolve => setTimeout(resolve, 1000));

    let updatedTicket: Ticket | undefined;

    setTickets(prev => {
      return prev.map(ticket => {
        if (ticket.id === id) {
          updatedTicket = {
            ...ticket,
            ...updates,
            updatedAt: new Date(),
          };
          return updatedTicket;
        }
        return ticket;
      });
    });

    if (!updatedTicket) {
      throw new Error('Ticket not found');
    }

    return updatedTicket;
  };

  const updateTicketStatus = async (id: string, status: TicketStatus): Promise<Ticket> => {
    const ticket = getTicketById(id);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updatedTicket = await updateTicket(id, { status });

    // Create notification for ticket owner about status change
    const newNotification: Notification = {
      id: `notification-${notifications.length + 1}`,
      userId: ticket.userId,
      ticketId: ticket.id,
      message: `Your ticket "${ticket.subject}" has been marked as ${status}.`,
      read: false,
      createdAt: new Date(),
      type: 'status_change'
    };

    setNotifications(prev => [...prev, newNotification]);

    return updatedTicket;
  };

  const addComment = async (ticketId: string, content: string, isInternal: boolean): Promise<Comment> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticket = getTicketById(ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const newComment: Comment = {
      id: `comment-${new Date().getTime()}`,
      userId: currentUser?.id || '',
      content,
      isInternal,
      createdAt: new Date(),
      attachments: [] // Add empty attachments array for new comments
    };

    await updateTicket(ticketId, {
      comments: [...ticket.comments, newComment],
    });

    // Create notification about new comment (if not internal)
    if (!isInternal) {
      const newNotification: Notification = {
        id: `notification-${notifications.length + 1}`,
        userId: ticket.userId,
        ticketId: ticket.id,
        message: `New comment on ticket "${ticket.subject}"`,
        read: false,
        createdAt: new Date(),
        type: 'comment'
      };

      setNotifications(prev => [...prev, newNotification]);
    }

    return newComment;
  };

  const addAttachment = async (ticketId: string, file: File): Promise<Attachment> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticket = getTicketById(ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Create a URL for the file
    const url = URL.createObjectURL(file);

    const newAttachment: Attachment = {
      id: `attachment-${new Date().getTime()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: url,
      uploadedBy: currentUser?.id || '',
      uploadedAt: new Date()
    };

    await updateTicket(ticketId, {
      attachments: [...ticket.attachments, newAttachment],
    });

    return newAttachment;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const getUserNotifications = (userId: string) => {
    return notifications.filter(notification => notification.userId === userId);
  };

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        notifications,
        getTicketById,
        getTicketsByUser,
        getTicketsByStatus,
        createTicket,
        updateTicket,
        updateTicketStatus,
        addComment,
        addAttachment,
        markNotificationAsRead,
        getUserNotifications,
      }}

    >
      {children}
    </TicketsContext.Provider>
  );
};