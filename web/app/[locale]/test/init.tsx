import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
// Avatar/Badge not currently used - using custom div for StaffCard alignment
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/Input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Play,
    Pause,
    CheckCircle2,
    Trash2,
    Circle,
    MoreVertical,
    RotateCcw,
    UserPlus,
    Shuffle,
    ArrowLeft,
    Copy,
    Clock,
    Archive,
    // Plus removed - Add Service button no longer used
} from "lucide-react";
import { TicketService, ServiceStatus } from "./ServiceList";
import { Reorder, motion, PanInfo } from "framer-motion";

// Category colors for service item borders
const CATEGORY_BORDER_COLORS: Record<string, string> = {
    Hair: "border-l-amber-400",
    Nails: "border-l-pink-400",
    Spa: "border-l-brand-400",
    Massage: "border-l-cyan-400",
    Skincare: "border-l-rose-400",
    Waxing: "border-l-orange-400",
    Makeup: "border-l-fuchsia-400",
    default: "border-l-primary",
};

interface StaffGroupProps {
    staffId: string | null;
    staffName: string | null;
    services: TicketService[];
    onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
    onRemoveService: (serviceId: string) => void;
    onRemoveStaff?: (staffId: string) => void;
    onReassignStaff: (serviceIdOrIds: string | string[]) => void;
    onAddServiceToStaff: () => void;
    onEditService?: (serviceIds: string[]) => void;
    onChangeService?: (serviceIds: string[]) => void;
    onDiscountService?: (serviceIds: string[]) => void;
    onDuplicateServices?: (serviceIds: string[]) => void;
    selectedServices?: Set<string>;
    onToggleServiceSelection?: (serviceId: string) => void;
    onClearSelection?: () => void;
    isActive?: boolean;
    onActivate?: () => void;
    totalStaffCount?: number;
}

// STATUS_CONFIG - kept for future use if status badges are re-added
// const STATUS_CONFIG = {
//   not_started: { label: "Not Started", icon: Circle },
//   in_progress: { label: "In Progress", icon: Play },
//   paused: { label: "Paused", icon: Pause },
//   completed: { label: "Completed", icon: CheckCircle2 },
// };

function formatElapsedTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface ServiceItemProps {
    service: TicketService;
    isSelected: boolean;
    isInactive: boolean;
    elapsedTime: number;
    onToggleSelection: (serviceId: string, event: React.MouseEvent) => void;
    onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
    onDuplicateService: (service: TicketService) => void;
    onDeleteService?: (serviceId: string) => void;
}

function ServiceItem({
    service,
    isSelected,
    isInactive,
    elapsedTime,
    onToggleSelection,
    onUpdateService,
    onDuplicateService,
    onDeleteService,
}: ServiceItemProps) {
    const [editingPrice, setEditingPrice] = useState(false);
    const [tempPrice, setTempPrice] = useState(service.price.toString());
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);

    const progressPercentage = service.status === 'in_progress' && service.duration > 0
        ? Math.min((elapsedTime / (service.duration * 60)) * 100, 100)
        : service.status === 'completed'
            ? 100
            : 0;

    const handlePriceEdit = (newPrice: string) => {
        const parsed = parseFloat(newPrice);
        if (!isNaN(parsed) && parsed >= 0) {
            onUpdateService(service.id, { price: parsed });
        }
        setEditingPrice(false);
    };

    // handlePriceAdjustment removed - using inline price editing instead
    // Kept for reference if quick adjustment buttons are re-added
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePriceAdjustment = (amount: number) => {
        const newPrice = Math.max(0, service.price + amount);
        onUpdateService(service.id, { price: newPrice });
    };
    void handlePriceAdjustment; // Prevent unused warning

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Only allow left swipe (negative offset)
        const offset = Math.min(0, info.offset.x);
        setSwipeOffset(offset);

        // Reveal delete button if swiped more than 40px
        if (offset < -40) {
            setIsSwipeRevealed(true);
        } else {
            setIsSwipeRevealed(false);
        }
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Snap to revealed or hidden state
        if (info.offset.x < -60) {
            // Snap to revealed
            setSwipeOffset(-80);
            setIsSwipeRevealed(true);
        } else {
            // Snap back to hidden
            setSwipeOffset(0);
            setIsSwipeRevealed(false);
        }
    };

    const handleDelete = () => {
        if (onDeleteService) {
            onDeleteService(service.id);
        }
    };

    return (
        <div className="relative overflow-hidden" data-testid={`service-item-container-${service.id}`}>
            {/* Delete Action (behind the service item - positioned absolute right) */}
            <div
                className={`absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive transition-all duration-200 ${isSwipeRevealed ? 'w-16 opacity-100' : 'w-0 opacity-0'
                    }`}
            >
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-11 text-white hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                    onClick={handleDelete}
                    data-testid={`button-delete-swipe-${service.id}`}
                    aria-label={`Delete ${service.serviceName} service`}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>

            {/* Swipeable Service Item - Compact single-row design */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ x: swipeOffset }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`group px-3 py-2 flex items-center gap-2 transition-colors bg-card border-l-4 ${CATEGORY_BORDER_COLORS[service.category || ''] || CATEGORY_BORDER_COLORS.default
                    } ${isInactive
                        ? 'cursor-default opacity-60'
                        : 'cursor-pointer hover:bg-gray-50'
                    } ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                    }`}
                onClick={(e) => {
                    if (!isInactive && swipeOffset === 0) {
                        onToggleSelection(service.id, e as any);
                    }
                }}
                data-testid={`service-item-${service.id}`}
            >
                {/* Service Info - Name & Duration inline */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{service.serviceName}</h4>
                        {/* DISCONTINUED badge for archived services */}
                        {service.isArchived && (
                            <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0"
                                data-testid={`badge-discontinued-${service.id}`}
                                title="This service is no longer available for new bookings"
                            >
                                <Archive className="h-2.5 w-2.5" />
                                Discontinued
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3 inline mr-0.5" />
                            {service.duration}m
                        </span>
                        {service.status === 'in_progress' && (
                            <span className="text-xs font-medium text-primary flex-shrink-0" data-testid={`timer-${service.id}`}>
                                {formatElapsedTime(elapsedTime)}
                            </span>
                        )}
                    </div>
                    {/* Progress Bar - inline when in progress */}
                    {(service.status === 'in_progress' || service.status === 'completed') && (
                        <div className="flex items-center gap-2 mt-1">
                            <Progress
                                value={progressPercentage}
                                className="h-1 flex-1"
                                data-testid={`progress-${service.id}`}
                            />
                            <span className="text-[10px] text-muted-foreground">
                                {Math.round(progressPercentage)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Price - Compact with click to edit */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    {editingPrice ? (
                        <Input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onBlur={() => handlePriceEdit(tempPrice)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePriceEdit(tempPrice);
                                if (e.key === 'Escape') {
                                    setTempPrice(service.price.toString());
                                    setEditingPrice(false);
                                }
                            }}
                            className="h-6 w-16 text-xs"
                            autoFocus
                            data-testid={`input-price-${service.id}`}
                        />
                    ) : (
                        <button
                            className="text-sm font-semibold hover:text-primary transition-colors px-1"
                            onClick={() => setEditingPrice(true)}
                            data-testid={`text-price-${service.id}`}
                        >
                            ${service.price.toFixed(2)}
                        </button>
                    )}
                </div>

                {/* More Options - Single dropdown with all actions */}
                <div className="opacity-40 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={isInactive}
                                data-testid={`button-service-options-${service.id}`}
                                aria-label={`Options for ${service.serviceName}`}
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                                onClick={() => onDuplicateService(service)}
                                data-testid={`option-duplicate-${service.id}`}
                            >
                                <Copy className="mr-2 h-3.5 w-3.5" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onToggleSelection(service.id, {} as React.MouseEvent)}
                                data-testid={`option-select-${service.id}`}
                            >
                                <Circle className="mr-2 h-3.5 w-3.5" />
                                Select
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.div>
        </div>
    );
}

export default function StaffGroup({
    staffId,
    staffName,
    services,
    onUpdateService,
    onRemoveService,
    onRemoveStaff,
    onReassignStaff,
    onAddServiceToStaff: _onAddServiceToStaff, // Kept for interface, button removed
    onDuplicateServices,
    selectedServices = new Set(),
    onToggleServiceSelection,
    isActive = false,
    onActivate,
    totalStaffCount = 1,
}: StaffGroupProps) {
    // Timer tracking for in-progress services
    const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});
    // Status change announcements for screen readers
    const [statusAnnouncement] = useState<string>("");
    const [orderedServices, setOrderedServices] = useState(services);
    const [containerWidth, setContainerWidth] = useState<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)


    // Update ordered services when services prop changes
    useEffect(() => {
        setOrderedServices(services);
    }, [services]);

    useEffect(() => {
        if (!containerRef.current) return

        let rafId: number | null = null

        const observer = new ResizeObserver(entries => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                for (const entry of entries) {
                    setContainerWidth(entry.contentRect.width)
                }
                rafId = null
            })
        })

        observer.observe(containerRef.current)
        setContainerWidth(containerRef.current.offsetWidth)

        return () => {
            observer.disconnect()
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [])
    // Timer effect - updates every second for in-progress services
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTimes((prev) => {
                const updated = { ...prev };
                services.forEach((service) => {
                    if (service.status === 'in_progress') {
                        const startTime = service.startTime ? new Date(service.startTime).getTime() : Date.now();
                        const elapsed = Math.floor((Date.now() - startTime) / 1000);
                        updated[service.id] = elapsed;
                    } else if (service.status === 'completed' && service.startTime) {
                        // Keep the elapsed time at completion
                        if (!updated[service.id]) {
                            updated[service.id] = service.duration * 60;
                        }
                    } else {
                        // Reset for not_started or paused
                        updated[service.id] = 0;
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [services]);

    const getStaffInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const totalAmount = services.reduce((sum, s) => sum + s.price, 0);
    // totalDuration not currently displayed in simplified header
    // const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

    // Determine staff-level status
    const allCompleted = services.length > 0 && services.every((s) => s.status === "completed");
    const anyInProgress = services.some((s) => s.status === "in_progress");
    const canStart = services.some((s) => s.status === "not_started" || s.status === "paused");
    const canComplete = services.some((s) => s.status !== "completed");

    // Get overall status for display - kept for future use
    // const getOverallStatus = () => {
    //   if (services.length === 0) return "not_started";
    //   if (allCompleted) return "completed";
    //   if (anyInProgress) return "in_progress";
    //   const anyPaused = services.some((s) => s.status === "paused");
    //   if (anyPaused) return "paused";
    //   return "not_started";
    // };
    // const overallStatus = getOverallStatus();
    // const statusConfig = STATUS_CONFIG[overallStatus];
    // const StatusIcon = statusConfig.icon;

    const handleStaffStatusAction = () => {
        if (anyInProgress) {
            // Pause all in-progress services
            services
                .filter((s) => s.status === "in_progress")
                .forEach((s) => onUpdateService(s.id, { status: "paused" }));
        } else if (canStart) {
            // Start all not-started or paused services
            services
                .filter((s) => s.status === "not_started" || s.status === "paused")
                .forEach((s) => onUpdateService(s.id, { status: "in_progress", startTime: new Date() }));
        }
    };

    const handleCompleteAll = () => {
        services
            .filter((s) => s.status !== "completed")
            .forEach((s) => onUpdateService(s.id, { status: "completed" }));
    };

    const handleToggleService = (serviceId: string, _event: React.MouseEvent) => {
        if (onToggleServiceSelection) {
            onToggleServiceSelection(serviceId);
        }
    };

    const handleDuplicateService = (service: TicketService) => {
        if (onDuplicateServices) {
            onDuplicateServices([service.id]);
        }
    };

    const handleReorder = (newOrder: TicketService[]) => {
        setOrderedServices(newOrder);
    };

    const handleStaffOptions = (action: string, status?: ServiceStatus) => {
        switch (action) {
            case "assign":
                // Trigger assign staff for all services in this group
                const allServiceIds = services.map(s => s.id);
                if (allServiceIds.length > 0) {
                    onReassignStaff(allServiceIds);
                }
                break;
            case "change_all_status":
                if (status) {
                    services.forEach(s => onUpdateService(s.id, { status }));
                }
                break;
            case "reset":
                services.forEach(s => onUpdateService(s.id, { status: "not_started" }));
                break;
            case "remove":
                if (staffId && onRemoveStaff) {
                    // Use the remove staff callback if available
                    onRemoveStaff(staffId);
                } else {
                    // Fallback: just remove services
                    services.forEach(s => onRemoveService(s.id));
                }
                break;
        }
    };


    // Determine if we should show activation UI
    // Show activation UI when there are multiple staff members
    const hasMultipleStaff = totalStaffCount > 1;
    const showActivation = hasMultipleStaff && staffId;
    const isInactive = Boolean(!isActive && showActivation);

    // Show "Adding Services Here" indicator when staff is active (even with single staff)
    const showActiveIndicator = isActive && staffId;

    return (
        <>
            {/* ARIA Live Region for Status Announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {statusAnnouncement}
            </div>

            <Card
                ref={containerRef}
                className={`overflow-hidden transition-all duration-200 rounded-xl ${showActiveIndicator
                    ? 'border-2 border-primary/30 shadow-lg shadow-primary/10 ring-2 ring-primary/20 bg-primary/5'
                    : staffId
                        ? 'border border-border'
                        : 'border-2 border-destructive/50'
                    } ${isInactive ? 'opacity-60 saturate-75 cursor-pointer hover:opacity-80 hover:shadow-md' : ''}`}
                onClick={(e) => {
                    // Make inactive staff clickable to activate (only if multiple staff exist)
                    if (isInactive && onActivate) {
                        const target = e.target as HTMLElement;
                        // Don't activate if clicking on buttons or interactive elements
                        if (!target.closest('button') && !target.closest('[role="button"]')) {
                            onActivate();
                        }
                    }
                }}
                data-testid={`staff-group-${staffId || 'unassigned'}`}
            >
                {/* Active Staff Indicator - Shows when staff is active (even with single staff) */}
                {showActiveIndicator && (
                    <div className="bg-gradient-to-r from-primary to-primary/90 px-4 py-1.5 flex items-center justify-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-xs font-semibold text-white tracking-wide uppercase">
                            Adding Services Here
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                )}

                {/* Inactive Staff Indicator - Shows click hint */}
                {isInactive && (
                    <div className="bg-muted/50 px-4 py-1.5 flex items-center justify-center border-b gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Inactive - Click to Activate
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    </div>
                )}

                {/* Staff Header - Aligned with StaffCard design from FrontDesk */}
                <div
                    className={`p-2 border-b border-border/50 flex items-center justify-between ${showActiveIndicator
                        ? 'bg-gradient-to-r from-slate-50 to-slate-100/50'
                        : ''
                        }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {staffName ? (
                            <>
                                {/* Avatar - Matching StaffCard circular style with gradient */}
                                <div
                                    className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                                    style={{
                                        background: 'linear-gradient(to bottom right, #FFFFFF, #F8FAFC)',
                                        border: '2px solid #E5E5E5',
                                    }}
                                >
                                    <span
                                        className="font-black text-sm tracking-widest uppercase"
                                        style={{
                                            color: '#525252',
                                            textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                                        }}
                                    >
                                        {getStaffInitials(staffName)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {/* Name - Matching StaffCard uppercase bold style - CLICKABLE TO REASSIGN */}
                                        <button
                                            onClick={() => {
                                                const allServiceIds = services.map(s => s.id);
                                                if (allServiceIds.length > 0) {
                                                    onReassignStaff(allServiceIds);
                                                }
                                            }}
                                            className="font-black text-sm tracking-wide uppercase truncate cursor-pointer hover:opacity-70 hover:underline transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded px-1"
                                            style={{ color: '#525252' }}
                                            title="Click to reassign staff"
                                            aria-label={`Reassign all services for ${staffName}`}
                                        >
                                            {staffName}
                                        </button>
                                        {showActiveIndicator && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                        {services.length} {services.length === 1 ? "service" : "services"} · ${totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-1 min-w-0">
                                    <Button
                                        variant="destructive"
                                        size="default"
                                        className="mb-2"
                                        onClick={() => handleStaffOptions("assign")}
                                        data-testid="button-assign-staff-primary"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Assign Staff
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        {services.length} {services.length === 1 ? "service" : "services"} • ${totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Staff-level Actions - Disabled when inactive */}
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        {canComplete && staffId && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCompleteAll}
                                disabled={isInactive}
                                className="h-7 sm:h-8 md:h-9 text-xs gap-1 px-1.5 sm:px-2"
                                data-testid={`button-complete-all-${staffId || "unassigned"}`}>
                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {containerWidth >= 400 && <span>Complete All</span>}
                            </Button>
                        )}
                        {!allCompleted && staffId && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                onClick={handleStaffStatusAction}
                                disabled={isInactive}
                                data-testid={`button-staff-status-${staffId || "unassigned"}`}
                                aria-label={
                                    anyInProgress
                                        ? `Pause all services for ${staffName}`
                                        : `Start all services for ${staffName}`
                                }>
                                {anyInProgress ? (
                                    <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                ) : (
                                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                )}
                            </Button>
                        )}

                        {/* More Options Dropdown - Disabled when inactive */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    disabled={isInactive}
                                    data-testid={`button-staff-options-${staffId || "unassigned"}`}
                                    aria-label={`More options for ${staffName || "unassigned services"}`}>
                                    <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!staffId && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => handleStaffOptions("assign")}
                                            data-testid="option-assign-staff">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Assign Staff
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                {/* Change Status Submenu */}
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger data-testid="submenu-change-status">
                                        <Shuffle className="mr-2 h-4 w-4" />
                                        Change Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleStaffOptions("change_all_status", "not_started")
                                            }
                                            data-testid="option-status-not-started">
                                            <Circle className="mr-2 h-4 w-4" />
                                            Not Started
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleStaffOptions("change_all_status", "in_progress")
                                            }
                                            data-testid="option-status-in-service">
                                            <Play className="mr-2 h-4 w-4" />
                                            In Service
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleStaffOptions("change_all_status", "paused")
                                            }
                                            data-testid="option-status-pause">
                                            <Pause className="mr-2 h-4 w-4" />
                                            Pause
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleStaffOptions("change_all_status", "completed")
                                            }
                                            data-testid="option-status-done">
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Done
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuItem
                                    onClick={() => handleStaffOptions("reset")}
                                    data-testid="option-reset-items">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Items
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleStaffOptions("remove")}
                                    className="text-destructive"
                                    data-testid="option-remove-staff">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove {staffId ? "Staff" : "All"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Services List with Drag & Drop */}
                <div>
                    {services.length === 0 && staffId ? (
                        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                <span>Click a service to add to {staffName}</span>
                            </div>
                        </div>
                    ) : (
                        <Reorder.Group
                            axis="y"
                            values={orderedServices}
                            onReorder={handleReorder}
                            className="divide-y"
                        >
                            {orderedServices.map((service) => {
                                const isSelected = selectedServices.has(service.id);
                                const elapsedTime = elapsedTimes[service.id] || 0;

                                return (
                                    <Reorder.Item
                                        key={service.id}
                                        value={service}
                                        className="list-none"
                                        data-testid={`reorder-item-${service.id}`}
                                    >
                                        <ServiceItem
                                            service={service}
                                            isSelected={isSelected}
                                            isInactive={isInactive}
                                            elapsedTime={elapsedTime}
                                            onToggleSelection={handleToggleService}
                                            onUpdateService={onUpdateService}
                                            onDuplicateService={handleDuplicateService}
                                            onDeleteService={onRemoveService}
                                        />
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    )}

                    {/* Add Service button removed - redundant since:
            1. "ADDING SERVICES HERE" banner clearly shows active staff
            2. Left panel services automatically add to active staff
            3. Pulsing dot indicator reinforces which staff is active */}
                </div>
            </Card>
        </>
    );
}
