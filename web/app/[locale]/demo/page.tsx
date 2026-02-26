"use client";

import { useState, useEffect, useCallback } from "react";
import StaffGroup from "../test/page";
import {
    TicketService,
    MOCK_SERVICES,
    getUniqueStaffFromServices,
    generateServiceId
} from "../test/ServiceList";

// ============================================
// DEMO PAGE - Wrapper để test StaffGroup UI
// Không sửa code gốc, chỉ truyền mock data vào
// ============================================

export default function DemoPage() {
    // State quản lý services (load từ mock data)
    const [services, setServices] = useState<TicketService[]>([]);
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
    const [activeStaffId, setActiveStaffId] = useState<string | null>(null);

    // Load mock data on mount
    useEffect(() => {
        setServices(MOCK_SERVICES);
        // Set staff đầu tiên làm active
        const staffList = getUniqueStaffFromServices();
        const firstStaff = staffList.find(s => s.staffId !== null);
        if (firstStaff) {
            setActiveStaffId(firstStaff.staffId);
        }
    }, []);

    // Nhóm services theo staffId
    const groupedServices = useCallback(() => {
        const groups = new Map<string | null, TicketService[]>();

        services.forEach((service) => {
            const key = service.staffId ?? null;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(service);
        });

        return groups;
    }, [services]);

    // Handler: Cập nhật service
    const handleUpdateService = useCallback((serviceId: string, updates: Partial<TicketService>) => {
        setServices((prev) =>
            prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
        );
    }, []);

    // Handler: Xóa service
    const handleRemoveService = useCallback((serviceId: string) => {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        setSelectedServices((prev) => {
            const next = new Set(prev);
            next.delete(serviceId);
            return next;
        });
    }, []);

    // Handler: Xóa staff (xóa tất cả services của staff đó)
    const handleRemoveStaff = useCallback((staffId: string) => {
        setServices((prev) => prev.filter((s) => s.staffId !== staffId));
    }, []);

    // Handler: Reassign staff (giả lập - log ra console)
    const handleReassignStaff = useCallback((serviceIdOrIds: string | string[]) => {
        const ids = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds];
        console.log("Reassign staff for services:", ids);
        alert(`Reassign staff for ${ids.length} service(s). Check console for details.`);
    }, []);

    // Handler: Thêm service mới cho staff
    const handleAddServiceToStaff = useCallback((staffId: string | null, staffName: string | null) => {
        const newService: TicketService = {
            id: generateServiceId(),
            serviceName: "New Service",
            price: 50.00,
            duration: 30,
            status: "not_started",
            category: "Hair",
            staffId,
            staffName,
            startTime: null,
            isArchived: false,
        };
        setServices((prev) => [...prev, newService]);
    }, []);

    // Handler: Toggle chọn service
    const handleToggleServiceSelection = useCallback((serviceId: string) => {
        setSelectedServices((prev) => {
            const next = new Set(prev);
            if (next.has(serviceId)) {
                next.delete(serviceId);
            } else {
                next.add(serviceId);
            }
            return next;
        });
    }, []);

    // Handler: Clear selection
    const handleClearSelection = useCallback(() => {
        setSelectedServices(new Set());
    }, []);

    // Handler: Duplicate services
    const handleDuplicateServices = useCallback((serviceIds: string[]) => {
        setServices((prev) => {
            const newServices: TicketService[] = [];
            serviceIds.forEach((id) => {
                const original = prev.find((s) => s.id === id);
                if (original) {
                    newServices.push({
                        ...original,
                        id: generateServiceId(),
                        status: "not_started",
                        startTime: null,
                    });
                }
            });
            return [...prev, ...newServices];
        });
    }, []);

    // Handler: Activate staff
    const handleActivateStaff = useCallback((staffId: string | null) => {
        setActiveStaffId(staffId);
    }, []);

    const groups = groupedServices();
    const staffCount = groups.size;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        🧪 StaffGroup UI Demo
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Testing UI với mock data từ <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ServiceList.ts</code>
                    </p>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="font-medium">{services.length}</span>
                        <span className="text-gray-500">Services</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="font-medium">{staffCount}</span>
                        <span className="text-gray-500">Staff Groups</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="font-medium">{selectedServices.size}</span>
                        <span className="text-gray-500">Selected</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="font-medium">
                            ${services.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                        </span>
                        <span>Total</span>
                    </div>
                </div>
            </div>

            {/* Main Content - StaffGroups Grid */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {Array.from(groups.entries()).map(([staffId, staffServices]) => {
                        const staffName = staffServices[0]?.staffName ?? null;
                        const isActive = activeStaffId === staffId;

                        return (
                            <StaffGroup
                                key={staffId ?? "unassigned"}
                                staffId={staffId}
                                staffName={staffName}
                                services={staffServices}
                                onUpdateService={handleUpdateService}
                                onRemoveService={handleRemoveService}
                                onRemoveStaff={handleRemoveStaff}
                                onReassignStaff={handleReassignStaff}
                                onAddServiceToStaff={() => handleAddServiceToStaff(staffId, staffName)}
                                onDuplicateServices={handleDuplicateServices}
                                selectedServices={selectedServices}
                                onToggleServiceSelection={handleToggleServiceSelection}
                                onClearSelection={handleClearSelection}
                                isActive={isActive}
                                onActivate={() => handleActivateStaff(staffId)}
                                totalStaffCount={staffCount}
                            />
                        );
                    })}
                </div>

                {/* Empty State */}
                {services.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No services loaded.</p>
                        <button
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            onClick={() => setServices(MOCK_SERVICES)}
                        >
                            Load Mock Data
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
                <p>Mock data được load từ <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ServiceList.ts</code></p>
                <p className="mt-1">Click vào các services, buttons để test UI interactions</p>
            </footer>
        </div>
    );
}
