// TicketForm.tsx
import React, { useState } from 'react';
import axios from 'axios'; // axios might still be useful for direct file uploads if not handled by context
import { TicketType, TicketPriority } from '../../types';
import { useTickets } from '../../context/TicketsContext';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get authToken
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { PaperclipIcon, Send } from 'lucide-react';

interface TicketFormProps {
  onSuccess?: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSuccess }) => {
  const { createTicket: createTicketContext } = useTickets();
  const { currentUser, authToken } = useAuth(); // Get authToken from useAuth
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    type: 'technical-support' as TicketType,
    priority: 'medium' as TicketPriority,
    subject: '',
    description: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define your backend API base URL - This might not be needed directly here anymore if context handles calls
  // const API_BASE_URL = 'http://localhost:5000/api'; // Changed to relative path if backend is proxied

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const fileList = Array.from(e.target.files);

    const invalidFiles = fileList.filter(file => file.size > 10 * 1024 * 1024);

    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        files: `The following files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`,
      }));
      return;
    }

    if (files.length + fileList.length > 5) {
      setErrors(prev => ({
        ...prev,
        files: 'You can upload a maximum of 5 files.',
      }));
      return;
    }

    setFiles(prev => [...prev, ...fileList]);

    e.target.value = '';

    if (errors.files) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.files;
        return newErrors;
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length > 100) {
      newErrors.subject = 'Subject cannot exceed 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // You should now pass the form data and files to the context's createTicket function
      // The createTicket function in TicketsContext already handles the fetch/axios part
      // and re-fetching the list.

      // Create a FormData object to send both text data and files to the context's createTicket
      const formPayload = new FormData();
      formPayload.append('fullName', formData.fullName);
      formPayload.append('email', formData.email);
      formPayload.append('type', formData.type);
      formPayload.append('priority', formData.priority);
      formPayload.append('subject', formData.subject);
      formPayload.append('description', formData.description);

      // Add userId if available from currentUser
      if (currentUser?.id) {
         formPayload.append('userId', currentUser.id);
      }

      files.forEach((file) => {
        formPayload.append('attachments', file); // Append files under the 'attachments' key
      });

      // Call the createTicket function from the context
      // This function is designed to handle the API call and then re-fetch tickets
      // You might need to adjust `TicketsContext.tsx`'s `createTicket` to accept FormData
      // if it's currently only accepting JSON.
      // For now, let's pass a structured object, and you'll adapt `createTicket` in context.
      const ticketDataForContext = {
        ...formData,
        userId: currentUser?.id || '', // Ensure userId is passed if needed by backend
        attachments: files, // Pass files separately or as part of a FormData object if context is modified to handle it.
                           // Currently, createTicket in context only expects Partial<Ticket>,
                           // so it might need adjustment to directly handle File objects or FormData.
                           // The backend controller `submitTicketController.js` expects `req.body` and `req.files`.
                           // So, the `createTicket` in context should be modified to accept FormData or similar.
      };

      // Temporarily, if `createTicket` in context expects JSON, you'll need to decide
      // how to send files. The most robust way is for `createTicket` in context
      // to also use `FormData` or to have a separate `uploadAttachment` function.
      // For simplicity, let's assume `createTicketContext` is modified to accept FormData.

      // A better approach for the context's createTicket is to also handle FormData
      // and the axios call itself, as it's doing `Workspace`. Let's use `axios` within
      // the context for consistency with file uploads if that's easier.

      // Option 1: Modify createTicket in Context to accept FormData (recommended for consistency)
      // Option 2: Keep axios call here, but ensure createTicketContext (from context) is called
      //         to trigger fetchTickets. This means createTicketContext itself should *not*
      //         make another API call to create the ticket.

      // Let's go with Option 1, and assume you'll update `createTicket` in `TicketsContext.tsx`
      // to accept FormData and handle the `axios.post` with the `authToken`.

      // Since your backend controller uses `req.files`, it implies `multipart/form-data`.
      // So, `createTicket` in `TicketsContext` needs to be updated to make an `axios.post`
      // with `FormData`.

      // Let's modify `TicketsContext.tsx` first, then come back here.
      // (Assuming `createTicket` in `TicketsContext` is updated to handle FormData)

      const createdTicket = await createTicketContext(formPayload); // Pass FormData object

      console.log('Ticket submitted successfully:', createdTicket);

      // Reset form after successful submission
      setFormData({
        fullName: '',
        email: '',
        type: 'technical-support',
        priority: 'medium',
        subject: '',
        description: '',
      });
      setFiles([]); // Clear attached files

      // Call the optional success callback passed as prop
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to submit ticket:', error);
      let errorMessage = 'Failed to submit ticket. Please try again.';

      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      setErrors((prev) => ({
        ...prev,
        form: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-800">Submit a New Ticket</h2>
        <p className="text-gray-600 mt-1">
          Please provide the details below to create a support ticket
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select
              label="Ticket Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={[
                { value: 'bug', label: 'Bug' },
                { value: 'feature-request', label: 'Feature Request' },
                { value: 'technical-support', label: 'Technical Support' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Select
              label="Priority Level"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>

          <Input
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            error={errors.subject}
            helperText="Max 100 characters"
            className="mt-4"
            required
          />

          <TextArea
            label="Detailed Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            helperText="Min 50 characters. Please provide as much detail as possible."
            rows={5}
            className="mt-4"
            required
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>

            <div className="flex items-center">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <PaperclipIcon className="h-5 w-5 mr-2 text-gray-400" />
                Add Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <p className="ml-3 text-xs text-gray-500">
                Max 5 files, 10MB each
              </p>
            </div>

            {errors.files && (
              <p className="mt-1 text-sm text-red-600">{errors.files}</p>
            )}

            {files.length > 0 && (
              <ul className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-md">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between py-2 px-3 text-sm"
                  >
                    <div className="flex items-center">
                      <PaperclipIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="truncate">{file.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errors.form && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {errors.form}
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={<Send className="h-4 w-4" />}
          >
            Submit Ticket
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TicketForm;