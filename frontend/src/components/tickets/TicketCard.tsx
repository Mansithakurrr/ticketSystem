import React from 'react';
import { Ticket } from '../../types';
import { Card, CardBody } from '../ui/Card';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';
import TicketTypeBadge from './TicketTypeBadge';
import { Clock, Paperclip, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  className?: string;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  className = '',
}) => {
  const { isAdmin } = useAuth();
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <Card 
      className={`hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardBody>
        <div className="flex flex-wrap justify-between gap-2 mb-2">
          <div className="flex gap-2">
            <TicketTypeBadge type={ticket.type} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>
        
        <Link to={`/tickets/${ticket.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
            {ticket.subject}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {ticket.description}
        </p>
        
        <div className="flex flex-wrap justify-between text-xs text-gray-500 gap-y-2">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Opened {formatDate(ticket.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {ticket.attachments.length > 0 && (
              <div className="flex items-center">
                <Paperclip className="h-3 w-3 mr-1" />
                <span>{ticket.attachments.length}</span>
              </div>
            )}
            
            {ticket.comments.length > 0 && (
              <div className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {ticket.comments.length > 0 ? ticket.comments.length : 'No comments'}
              </div>
            )}
            
            {isAdmin && (
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                <span>{ticket.assignedTo ? 'Assigned' : 'Unassigned'}</span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default TicketCard;