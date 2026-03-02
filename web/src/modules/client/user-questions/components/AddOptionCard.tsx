"use client";
import React from "react";
import { PlusIcon } from "lucide-react";

type Props = {
  onClick: () => void;
};

const AddOptionCard: React.FC<Props> = ({ onClick }) => {
  return (
    <div
      className="border-2 border-dashed border-gray-300 dark:border-dark-4 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-dark-5 transition-colors min-h-[120px] bg-gray-50 dark:bg-dark-3/30"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center">
          <PlusIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Add Option
        </span>
      </div>
    </div>
  );
};

export default AddOptionCard;
