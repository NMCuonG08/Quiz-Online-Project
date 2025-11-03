"use client";

const RegisterBanner = () => {
  return (
    <div className="hidden lg:flex lg:flex-1 lg:relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")`,
        }}
      />
      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-start items-center text-white p-8">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Join QuizMe Today</h1>
          <p className="text-lg opacity-90">
            Start your learning journey with our interactive quizzes and track
            your progress
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterBanner;
