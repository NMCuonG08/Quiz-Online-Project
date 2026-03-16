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

type Quiz = {
    id: string;
    title: string;
    category: { name: string };
    creator: { full_name: string | null; username: string | null };
    created_at: string;
    thumbnail?: { url: string };
};

export function RecentQuizzes({
    data,
    className
}: {
    data: Quiz[];
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
                Recent Quizzes
            </h2>

            <Table>
                <TableHeader>
                    <TableRow className="border-none uppercase">
                        <TableHead className="!text-left">Quiz Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead className="!text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">No quizzes found</TableCell>
                        </TableRow>
                    ) : (
                        data.map((quiz) => (
                            <TableRow
                                className="text-base font-medium text-dark dark:text-white"
                                key={quiz.id}
                            >
                                <TableCell className="flex items-center gap-3">
                                    <div className="size-8 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                        {quiz.thumbnail?.url ? (
                                            <Image
                                                src={quiz.thumbnail.url}
                                                fill
                                                className="object-cover"
                                                alt={quiz.title}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">?</div>
                                        )}
                                    </div>
                                    <div className="truncate max-w-[200px]">{quiz.title}</div>
                                </TableCell>

                                <TableCell>{quiz.category.name}</TableCell>

                                <TableCell>{quiz.creator.full_name || quiz.creator.username}</TableCell>

                                <TableCell className="!text-right">
                                    {new Date(quiz.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
