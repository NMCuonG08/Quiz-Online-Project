import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/common/components/ui/table";
import { cn } from "@/lib/utils";
import Image from "next/image";

type User = {
    id: string;
    full_name: string | null;
    username: string | null;
    email: string;
    avatar: string | null;
    created_at: string;
};

export function RecentUsers({
    data,
    className
}: {
    data: User[];
    className?: string
}) {
    return (
        <div
            className={cn(
                "grid rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-[#122031] dark:shadow-card",
                className
            )}
        >
            <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
                New Users
            </h2>

            <Table>
                <TableHeader>
                    <TableRow className="border-none uppercase">
                        <TableHead className="!text-left">User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="!text-right">Joined</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">No users found</TableCell>
                        </TableRow>
                    ) : (
                        data.map((user) => (
                            <TableRow
                                className="text-base font-medium text-dark dark:text-white"
                                key={user.id}
                            >
                                <TableCell className="flex items-center gap-3">
                                    <div className="size-8 relative rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                        {user.avatar ? (
                                            <Image
                                                src={user.avatar}
                                                fill
                                                className="object-cover"
                                                alt={user.full_name || "User avatar"}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 capitalize bg-primary/10 text-primary">
                                                {(user.full_name || user.username || "U").charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grow">
                                        <div className="font-semibold text-dark dark:text-white truncate max-w-[150px]">
                                            {user.full_name || user.username}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="max-w-[200px] truncate">{user.email}</TableCell>

                                <TableCell className="!text-right">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
