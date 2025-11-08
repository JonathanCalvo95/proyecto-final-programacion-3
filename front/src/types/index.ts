export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Space {
  _id: string;
  title: string;
  description?: string;
  type: 'meeting_room' | 'desk' | 'private_office';
  capacity: number;
  hourlyRate: number;
  amenities: string[];
}

export interface Reservation {
  _id: string;
  space: Space | string;
  start: string;
  end: string;
  status: 'active' | 'cancelled';
}
