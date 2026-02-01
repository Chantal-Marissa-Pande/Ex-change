import React from "react";

export default function Hero({ onGetStarted, onExploreSkills }) {
  return (
    <section className="bg-background py-20 text-center">
      <h1 className="text-primary text-4xl font-bold mb-4">
        Exchange Skills. Build Community.
      </h1>
      <p className="text-text mb-8 text-lg">
        Learn without money. Share what you know.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onGetStarted}
          className="bg-accent text-text px-6 py-3 rounded-lg font-medium hover:opacity-90"
        >
          Get Started
        </button>
        <button
          onClick={onExploreSkills}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
        >
          Explore Skills
        </button>
      </div>
    </section>
  );
}