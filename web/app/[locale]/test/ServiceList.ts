// Types for ticket services
export type ServiceStatus = "not_started" | "in_progress" | "paused" | "completed";

export interface TicketService {
  id: string;
  serviceName: string;
  price: number;
  duration: number; // in minutes
  status: ServiceStatus;
  category?: string;
  staffId?: string | null;
  staffName?: string | null;
  startTime?: Date | null;
  isArchived?: boolean;
}

// Service categories available
export const SERVICE_CATEGORIES = [
  "Hair",
  "Nails", 
  "Spa",
  "Massage",
  "Skincare",
  "Waxing",
  "Makeup",
] as const;

// Mock staff data
export const MOCK_STAFF = [
  { id: "staff-1", name: "Sarah Johnson" },
  { id: "staff-2", name: "Mike Chen" },
  { id: "staff-3", name: "Emily Davis" },
  { id: "staff-4", name: "John Smith" },
] as const;

// Mock services data for testing UI
export const MOCK_SERVICES: TicketService[] = [
  // Services for Staff 1 (Sarah Johnson)
  {
    id: "service-1",
    serviceName: "Premium Haircut & Styling",
    price: 85.00,
    duration: 45,
    status: "in_progress",
    category: "Hair",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    startTime: new Date(Date.now() - 15 * 60 * 1000), // Started 15 mins ago
    isArchived: false,
  },
  {
    id: "service-2",
    serviceName: "Deep Conditioning Treatment",
    price: 45.00,
    duration: 30,
    status: "not_started",
    category: "Hair",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    startTime: null,
    isArchived: false,
  },
  {
    id: "service-3",
    serviceName: "Balayage Color",
    price: 180.00,
    duration: 120,
    status: "not_started",
    category: "Hair",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    startTime: null,
    isArchived: true, // Discontinued service
  },

  // Services for Staff 2 (Mike Chen)
  {
    id: "service-4",
    serviceName: "Full Body Massage",
    price: 120.00,
    duration: 60,
    status: "completed",
    category: "Massage",
    staffId: "staff-2",
    staffName: "Mike Chen",
    startTime: new Date(Date.now() - 70 * 60 * 1000),
    isArchived: false,
  },
  {
    id: "service-5",
    serviceName: "Hot Stone Therapy",
    price: 90.00,
    duration: 45,
    status: "paused",
    category: "Spa",
    staffId: "staff-2",
    staffName: "Mike Chen",
    startTime: new Date(Date.now() - 20 * 60 * 1000),
    isArchived: false,
  },

  // Services for Staff 3 (Emily Davis)
  {
    id: "service-6",
    serviceName: "Gel Manicure",
    price: 55.00,
    duration: 40,
    status: "in_progress",
    category: "Nails",
    staffId: "staff-3",
    staffName: "Emily Davis",
    startTime: new Date(Date.now() - 25 * 60 * 1000),
    isArchived: false,
  },
  {
    id: "service-7",
    serviceName: "Pedicure Deluxe",
    price: 65.00,
    duration: 50,
    status: "not_started",
    category: "Nails",
    staffId: "staff-3",
    staffName: "Emily Davis",
    startTime: null,
    isArchived: false,
  },
  {
    id: "service-8",
    serviceName: "Nail Art Design",
    price: 35.00,
    duration: 30,
    status: "not_started",
    category: "Nails",
    staffId: "staff-3",
    staffName: "Emily Davis",
    startTime: null,
    isArchived: false,
  },

  // Unassigned services (no staff)
  {
    id: "service-9",
    serviceName: "Facial Treatment",
    price: 95.00,
    duration: 60,
    status: "not_started",
    category: "Skincare",
    staffId: null,
    staffName: null,
    startTime: null,
    isArchived: false,
  },
  {
    id: "service-10",
    serviceName: "Full Leg Waxing",
    price: 75.00,
    duration: 45,
    status: "not_started",
    category: "Waxing",
    staffId: null,
    staffName: null,
    startTime: null,
    isArchived: false,
  },
];

// Helper function to get services by staff ID
export function getServicesByStaff(staffId: string | null): TicketService[] {
  return MOCK_SERVICES.filter((service) => service.staffId === staffId);
}

// Helper function to get all unique staff from services
export function getUniqueStaffFromServices(): Array<{ staffId: string | null; staffName: string | null }> {
  const staffMap = new Map<string | null, string | null>();
  
  MOCK_SERVICES.forEach((service) => {
    if (!staffMap.has(service.staffId)) {
      staffMap.set(service.staffId, service.staffName);
    }
  });

  return Array.from(staffMap.entries()).map(([staffId, staffName]) => ({
    staffId,
    staffName,
  }));
}

// Generate a new service ID
export function generateServiceId(): string {
  return `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
