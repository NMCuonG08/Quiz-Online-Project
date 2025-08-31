import React from "react";
import UserSidebar from "./UserSidebar";
import MainContent from "./MainContent";

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Main Content */}
      <div className="flex-1 p-6">
        <MainContent />
      </div>

      {/* Right Sidebar - User Information */}
      <div className="w-80 bg-white shadow-lg">
        <UserSidebar />
      </div>
    </div>
  );
};

export default DashboardLayout;
