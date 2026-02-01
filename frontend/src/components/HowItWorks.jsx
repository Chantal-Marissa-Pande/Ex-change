import React from "react";
import { LightBulbIcon, HandThumbUpIcon, BookOpenIcon } from "@heroicons/react/24/solid";

const steps = [
  {
    title: "Post a Skill",
    description: "Share your expertise with the community and make your skills accessible to others.",
    icon: <LightBulbIcon className="h-10 w-10 text-secondary mb-4" />
  },
  {
    title: "Request an Exchange",
    description: "Find someone with a skill you want to learn and request an exchange.",
    icon: <HandThumbUpIcon className="h-10 w-10 text-secondary mb-4" />
  },
  {
    title: "Learn Together",
    description: "Grow together as a community, exchanging knowledge without monetary barriers.",
    icon: <BookOpenIcon className="h-10 w-10 text-secondary mb-4" />
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background py-20 text-center">
      <h2 className="text-primary text-3xl font-bold mb-12">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-8 px-6 md:px-20">
        {steps.map((step, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition">
            {step.icon}
            <h3 className="text-text font-semibold text-xl mb-2">{step.title}</h3>
            <p className="text-text text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}