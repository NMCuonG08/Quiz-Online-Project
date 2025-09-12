import React from "react";
import Image from "next/image";

const OffersSection = () => {
  const offers = [
    {
      id: 1,
      title: "Personalized Learning",
      description: "Customized lessons that evolve with your child's progress.",
      icon: "/icons/icon1.png",
      image: "/icons/green.jpg",
    },
    {
      id: 2,
      title: "Creative Activities",
      description:
        "Discover enjoyable activities such as coloring, crafting, and science.",
      icon: "/icons/icon3.png",
      image: "/icons/blue.jpg",
    },
    {
      id: 3,
      title: "Interactive Games",
      description: "Learn something new while your kids playing games!",
      icon: "/icons/icon2.png",
      image: "/icons/pink.jpg",
      featured: true,
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-8 lg:px-12 bg-gradient-to-br rounded-2xl from-background via-muted/50 to-background border border-border">
      <div className="max-w-7xl mx-auto">
        {/* Header with title and SVG stars */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground font-bold">
            What we offer
          </h2>
          <div className="flex items-center space-x-4">
            {/* Pink star SVG */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary"
            >
              <path
                d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Purple star SVG */}
            <svg
              width="35"
              height="35"
              viewBox="0 0 24 24"
              fill="none"
              className="text-accent-foreground"
            >
              <path
                d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`relative overflow-hidden border border-border rounded-lg ${
                offer.featured
                  ? "shadow-lg bg-card"
                  : "bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300"
              }`}
              style={{
                backgroundImage: `url(${offer.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Background pattern for featured card */}
              {offer.featured && (
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-accent/10 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 bg-accent/10 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent/5 rounded-full"></div>
                </div>
              )}

              <div className="p-8 relative z-10">
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                    offer.featured ? "bg-background" : "bg-muted"
                  }`}
                >
                  <Image
                    src={offer.icon}
                    alt={offer.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Title */}
                <h3
                  className={`text-2xl dark:text-black font-bold mb-4 ${
                    offer.featured ? "text-foreground" : "text-foreground"
                  }`}
                >
                  {offer.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-sm leading-relaxed dark:text-black ${
                    offer.featured
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {offer.description}
                </p>

                {/* Sparkle effect for featured card */}
                {offer.featured && (
                  <div className="absolute top-6 right-6">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-100"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
