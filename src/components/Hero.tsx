import React from 'react';
import { heroDetails } from '@/data/hero';

const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative flex items-center justify-center text-center text-white h-[80vh] md:h-[90vh] px-6 overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.4),
            rgba(0, 0, 0, 0.6)
          ),
          url('${heroDetails.backgroundImageSrc}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for a softer darkening effect */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        {/* Animated heading */}
        <h1 className="font-alata text-4xl md:text-6xl font-bold leading-tight mb-6 animate-fadeInDown">
          {heroDetails.heading}
        </h1>
        {/* Call-to-action button */}
        {heroDetails.ctaText && heroDetails.ctaLink && (
          <a
            href={heroDetails.ctaLink}
            className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300"
          >
            {heroDetails.ctaText}
          </a>
        )}
      </div>
      
      {/* Optional: Add some subtle floating animation or particles for extra flair */}
    </section>
  );
};

export default Hero;